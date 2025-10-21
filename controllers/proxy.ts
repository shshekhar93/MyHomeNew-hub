'use strict';
import { spawn } from 'child_process';
import { v4 as uuid } from 'uuid';

import UserModel from '../models/users.js';
import { logInfo, logError } from '../libs/logger.js';
import { getFileURL } from '../libs/esm-utils.js';
import type { NextFunction, Request, Response } from 'express';

const PROXY_SCRIPT_PATH = getFileURL('ws-proxy.js').pathname;

export type ProxyOptions = {
  server: string;
  id: string;
  secret: string;
  email: string;

  cpSecret?: string;
  localhost?: string;
};

function createChildProcess(options: ProxyOptions) {
  const child = spawn('node', [PROXY_SCRIPT_PATH], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });
  // restart the child process if it exits (should never happen)
  child.on('exit', () => createChildProcess(options));

  child.on('message', (message) => {
    logInfo(`Child process said: ${JSON.stringify(message)}`);
    // For now we don't care what child said, just that it came online.
    child.send(options);
  });
}

const proxyRequestsSetup = function (options: ProxyOptions) {
  const cpSecret = uuid();
  createChildProcess({
    ...options,
    cpSecret,
    localhost: `http://localhost:${process.env.PORT || 8020}`,
  });

  return async (req: Request, _res: Response, next: NextFunction) => {
    const reqSecret = req.get('websocket-proxy-request');
    const { email } = options;

    if (!reqSecret) {
      return next();
    }

    if (reqSecret !== cpSecret) {
      logError('Got CP request with wrong secret');
      return next();
    }

    try {
      req.user = (await UserModel.findOne({ email }) ?? undefined) as Express.User;
      next();
    }
    catch (err) {
      logError('Error finding default hub user');
      logError(err);
      next(err);
    }
  };
};

export { proxyRequestsSetup };
