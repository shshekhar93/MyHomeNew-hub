import { readdirSync, readFileSync, writeFileSync } from 'fs';
import nodeCrypto from 'crypto';
import * as Crypto from '../libs/crypto.js';
import { logInfo, logError } from '../libs/logger.js';
import websocket from 'websocket';

const WebSocketClient = websocket.client;

const allDevices = readdirSync(new URL('./mock-devices', import.meta.url))
  .filter(f => f.endsWith('.json'))
  .map(f =>
    JSON.parse(
      readFileSync(new URL(`./mock-devices/${f}`, import.meta.url), 'utf8'),
    ),
  );

allDevices.forEach(startDevice);

function sendJSON(conn, obj, key) {
  conn.send(Crypto.encrypt(JSON.stringify(obj), key));
}

function enableDeviceAPI(device, connection, key) {
  connection.on('message', (message) => {
    try {
      const payload = Crypto.decrypt(message.utf8Data, key, 'utf8');
      const request = JSON.parse(payload);

      switch (request.action) {
        case 'confirm-session':
          // noop
          break;
        case 'update-key':
          device.encryptionKey = request.data;
          logInfo(`Updating key for ${device.name}`);
          break;
        case 'update-username':
          device.username = request.data;
          logInfo(`Updating username for ${device.name}`);
          break;
        case 'set-state':
          // eslint-disable-next-line no-case-declarations
          const [leadId, brightness] = request.data.split('=');
          device[`lead${leadId}`] = brightness;
          logInfo(
            `Updating lead${leadId} with ${brightness} for ${device.name}`,
          );
          break;
        case 'get-state':
          // eslint-disable-next-line no-case-declarations
          const payload = {
            status: 'OK',
            lead0: device.lead0,
            lead1: device.lead1,
          };
          return sendJSON(connection, payload, key);
        default:
          return sendJSON(connection, { status: 'FAIL' }, key);
      }
      sendJSON(connection, { status: 'OK' }, key);
    }
    catch (e) {
      logError(e);
    }
  });

  connection.on('error', logError);

  connection.on('close', () => {
    setTimeout(startDevice.bind(null, device), 1000);
  });
}

function startDevice(device) {
  const key = nodeCrypto.randomBytes(16).toString('hex');
  const password = Crypto.encrypt(
    `${device.name}|${key}`,
    device.encryptionKey,
  );
  const wsClient = new WebSocketClient();

  wsClient.on('connect', (connection) => {
    logInfo('connected');
    enableDeviceAPI(device, connection, key);
  });

  wsClient.on('connectFailed', (err) => {
    logError(err);
  });

  wsClient.connect(`ws://${device.host}/v1/ws`, 'homeapplyed-device', null, {
    authorization: `${device.username}:${password}`,
    type: 'light',
  });
}

function saveDevice(device) {
  writeFileSync(
    new URL(`./mock-devices/${device.name}.json`, import.meta.url),
    JSON.stringify(device, null, 2),
  );
}

process.on('exit', () => {
  (allDevices || []).forEach(saveDevice);
});

process.on('SIGINT', () => {
  process.exit();
});
