'use strict';
import { spawn } from 'child_process';
import uuid from 'uuid/v4.js';

import UserModel from '../models/users.js';
import { logInfo, logError } from '../libs/logger.js';
import { getFileURL } from '../libs/esm-utils.js';

const PROXY_SCRIPT_PATH = getFileURL('ws-proxy.js').pathname;

function createChildProcess(options) {
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

const proxyRequestsSetup = function (options) {
  const cpSecret = uuid();
  createChildProcess({
    ...options,
    cpSecret,
    localhost: `http://localhost:${process.env.PORT || 8020}`,
  });

  return async (req, res, next) => {
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
      req.user = await UserModel.findOne({ email });
      next();
    } catch (err) {
      logError('Error finding default hub user');
      logError(err);
      next(err);
    }
  };
};

export { proxyRequestsSetup };
