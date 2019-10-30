const fs = require('fs');
const path = require('path');

const nodeCrypto = require('crypto');
const Crypto = require('../libs/crypto');
const WebSocketClient = require('websocket').client;

const allDevices = fs.readdirSync(path.join(__dirname, 'mock-devices'))
  .filter(f => f.endsWith('.json'))
  .map(f => require(path.join(__dirname, 'mock-devices', f)));

allDevices.forEach(startDevice);

function sendJSON(conn, obj, key) {
  conn.send(Crypto.encrypt(JSON.stringify(obj), key));
}

function enableDeviceAPI(device, connection, key) {
  connection.on('message', message => {
    try {
      const payload = Crypto.decrypt(message.utf8Data, key, 'utf8');
      const request = JSON.parse(payload);
      
      switch(request.action) {
        case 'confirm-session': 
          // noop
          break;
        case 'update-key': 
          device.encryptionKey = request.data;
          console.log('updating key for', device.name);
          break;
        case 'update-username': 
          device.username = request.data;
          console.log('updating username for', device.name);
          break;
        case 'set-state': 
          const [leadId, brightness] = request.data.split('=');
          device[`lead${leadId}`] = brightness;
          console.log('updating', leadId, 'with', brightness);
          break;
        case 'get-state':
          const payload = {
            status: 'OK',
            lead0: device.lead0,
            lead1: device.lead1
          };
          return sendJSON(connection, payload, key);
        default:
          return sendJSON(connection, { status: 'FAIL' }, key);
      }
      sendJSON(connection, { status: 'OK' }, key);
    } catch(e) {
      console.log('Failed to process server req', e.stack || e);
    }
  });

  connection.on('error', e => {
    console.error('connection error', e.stack || e);
  });

  connection.on('close', () => {
    setTimeout(startDevice.bind(null, device), 1000);
  });
}

function startDevice(device) {
  const key = nodeCrypto.randomBytes(16).toString('hex');
  const password = Crypto.encrypt(`${device.name}|${key}`, device.encryptionKey);
  const wsClient = new WebSocketClient();

  wsClient.on('connect', connection => {
    console.log('connected');
    enableDeviceAPI(device, connection, key);
  });

  wsClient.on('connectFailed', err => {
    console.error('connection failed', err.stack || err);
  });

  wsClient.connect(
    `ws://${device.host}/v1/ws`,
    'myhomenew-device',
    null,
    {
      authorization: `${device.username}:${password}`,
      type: 'light'
    }
  );
}

function saveDevice(device) {
  fs.writeFileSync(
    path.join(__dirname, 'mock-devices', `${device.name}.json`), 
    JSON.stringify(device, null, 2)
  );
}

process.on('exit', () => {
  (allDevices || []).forEach(saveDevice);
});

process.on('SIGINT', () => {
  process.exit();
});
