'use strict';
import Websocket from 'websocket';
import fetch from 'node-fetch';
import { logError, logInfo } from './libs/logger.js';

const PAYLOAD_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};
const NO_PAYLOAD_METHODS = ['GET', 'HEAD'];

const WSClient = Websocket.client;

/* WS Client setup */
const client = new WSClient({
  keepalive: true,
  useNativeKeepalive: false,
  keepaliveInterval: 5000,
  dropConnectionOnKeepaliveTimeout: true,
  keepaliveGracePeriod: 8000,
});

client.on('connectFailed', function (err) {
  logError(err);
  process.exit(1);
});

client.on('connect', function (connection) {
  connection.on('error', function (err) {
    logError('WS Conn error');
    logError(err);
  });

  connection.on('close', function () {
    logInfo('connection closed!');
    setTimeout(connect, 1000); // delay reconnect by a second.
  });

  connection.on('message', async (message) => {
    if (message.type === 'utf8') {
      try {
        logInfo(`Relaying request: ${message.utf8Data}`);
        const data = JSON.parse(message.utf8Data);
        const response = await handleMessage(data);
        connection.send(JSON.stringify(response));
      } catch (e) {
        logError(e);
      }
    }
  });
});
/* WS Client setup end */

/* Setup IPC with parent process */
let options = {};
process.on('message', (message) => {
  options = message;
  connect();
});
process.send({ state: 'ready' });
/* IPC setup end */

function connect() {
  if (!options || !options.server || !options.id || !options.secret) {
    logError('options not received yet from parent!');
    return;
  }
  const { server, id, secret } = options;
  client.connect(server, 'myhomenew', null, {
    authorization: `${id}:${secret}`,
  });
}

async function handleMessage(data) {
  try {
    const url = `${options.localhost}${data.url}`;
    const sendBody = !NO_PAYLOAD_METHODS.includes(data.method);
    const resp = await fetch(url, {
      method: data.method,
      headers: {
        ...(sendBody ? PAYLOAD_HEADERS : {}),
        'websocket-proxy-request': options.cpSecret,
      },
      body: sendBody ? JSON.stringify(data.body) : undefined,
    });
    const status = resp.status || 500;
    const body = await resp.text();

    return {
      body,
      status,
      reqId: data.reqId,
      type: resp.headers.get('content-type'),
    };
  } catch (err) {
    logError('WS Proxy request err');
    logError(err);
  }

  return { status: 500, body: '' };
}
