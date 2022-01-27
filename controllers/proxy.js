'use strict';
import { spawn } from 'child_process';
import uuid from 'uuid/v4.js';

import UserModel from '../models/users.js';
import { logError } from '../libs/logger.js';

const PROXY_SCRIPT_PATH = new URL('../ws-proxy.js', import.meta.url).pathname;

function createChildProcess(options) {
  const child = spawn('node', [PROXY_SCRIPT_PATH], {
    stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ]
  });
  // restart the child process if it exits (should never happen)
  child.on('exit', () => createChildProcess(options));

  child.send(options);
}

const proxyRequestsSetup = function(options) {
  const cpSecret = uuid();
  createChildProcess({
    ...options, 
    cpSecret,
    localhost: `http://localhost:${process.env.PORT || 8020}`
  });

  return function(req, res, next) {
    const reqSecret = req.get('websocket-proxy-request');

    if(!reqSecret) {
      return next();
    }

    if(reqSecret !== cpSecret){
      logError('Got CP request with wrong secret');
      return next();
    }

    UserModel.findOne({email: options.email})
      .then(user => {
        req.user = user;
        next();
      })
      .catch(err => {
        logError('Error finding default hub user');
        logError(err);
        next(err);
      })
  }
};

export {
  proxyRequestsSetup
};
