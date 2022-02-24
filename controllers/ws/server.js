import { server as WebsocketServer } from 'websocket';
import _get from 'lodash/get.js';
import EventEmitter from 'events';

import { authenticateDevice, authenticateHub } from './auth.js';
import { onConnect as onDeviceConnect } from './device.js';
import { onConnect as onHubConnect } from './hub.js';
import { logError } from '../../libs/logger.js';
import { createProxyMiddleware } from './helpers.js';

const PROTOCOLS = {
  'myhomenew-device': {
    authenticate: authenticateDevice,
    orchestrate: onDeviceConnect,
  },
  myhomenew: {
    authenticate: authenticateHub,
    orchestrate: onHubConnect,
  },
};

const emitter = new EventEmitter();
const proxy = createProxyMiddleware(emitter);

const isDevOnline = (name) => {
  return emitter.listenerCount(name) > 0;
};

const requestToDevice = (name, obj) => {
  return new Promise((resolve, reject) => {
    emitter.emit(name, {
      ...obj,
      cb: (err, resp) => {
        if (err) {
          return reject(err);
        }
        return resolve(resp);
      },
    });
  });
};

const start = (httpServer) => {
  const wsServer = new WebsocketServer({
    httpServer,
    autoAcceptConnections: false,
  });

  wsServer.on('request', async function (request) {
    const protocol = request.requestedProtocols[0];
    const flow = PROTOCOLS[protocol];
    if (!flow) {
      logError(`Unknown protocol requested: ${protocol}`);
      return request.reject(404);
    }

    const auth = _get(request, 'httpRequest.headers.authorization', '');
    const [username, password] = auth.split(':');
    if (!username || !password) {
      logError('Either client id or secret missing in hub WS Req');
      return request.reject(401);
    }

    const { authenticate, orchestrate } = flow;

    const result = await authenticate(username, password);
    if (!result) {
      logError(`Failed to authenticate: ${username} using ${protocol}`);
      return request.reject(401);
    }

    const connection = request.accept(protocol, request.origin);
    connection.on('error', (err) => {
      logError(
        `Connection error for ${usename} using ${protocol}:\n${err.stack}`
      );
    });

    orchestrate(connection, emitter, ...result).catch((err) => {
      logError('device setup sequence failed');
      logError(err);
      connection.close();
    });
  });
};

export { isDevOnline, requestToDevice, proxy, start };
