'use strict';
const uuid = require('uuid/v4');
const WebsocketServer = require('websocket').server;
const _get = require('lodash/get');
const EventEmitter = require('events');
const { validateHubCreds, validateDeviceCreds } = require('./ws-helpers');
const { encrypt } = require('./crypto');
const JSON_TYPE = 'application/json';

const emitter = new EventEmitter();

module.exports.proxy = function(req, res) {
  const hubClientId = _get(req, 'user.hubClientId');

  if(emitter.listenerCount(hubClientId) === 0) {
    // We should at least retry once in a second or so!!
    return res.status(503).end(); // Server is unavailable.
  }

  emitter.emit(hubClientId, {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    type: req.get('content-type'),
    cb: resp => {
      const respPayload = typeof resp.body !== 'string' ? JSON.stringify(resp.body) : resp.body; 
      res.status(resp.status || 200).type(req.type || JSON_TYPE).end(respPayload);
    }
  });
};

function onHubConnect(connection, user) {
  const hubClientId = user.hubClientId;

  if(emitter.listenerCount(hubClientId) > 0) {
    console.error('already have a hub attached for account');
    return connection.close();
  }

  function onRequest(reqData) {
    const { cb } = reqData;
    const reqId = uuid();
    reqData = {
      ...reqData, 
      reqId,
      cb: undefined
    };
    connection.on('message', function onResponse(message) {
      try {
        const payload = JSON.parse(message.utf8Data);
        if(payload.reqId !== reqId) {
          return; // This message is not for us. Ignore.
        }
        
        cb(payload);
        connection.removeListener(message, onResponse);
      } catch(e) {
        console.error('could not parse message', message.utf8Data);
      }
    });

    connection.send(JSON.stringify(reqData));
  }

  emitter.on(hubClientId, onRequest);

  // Clean up on websocket close.
  connection.on('close', function() {
    emitter.removeListener(hubClientId, onRequest);
  });
}

function onDeviceConnect(connection, device, user) {
  console.log('device connected!');
}

function executeKeyUpdate(connection, newKey, oldKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      action: "update-key",
      data: newKey
    });
    const encryptedPayload = encrypt(payload, oldKey);

    connection.once('message', function(data) {
      if(data === 'OK') {
        return resolve();
      }
      connection.close();
      return reject(new Error('DEVICE_KEY_UPDATE_FAILED')); 
    });

    connection.send(encryptedPayload);
  });
}

module.exports.start = httpServer => {
  const wsServer = new WebsocketServer({
    httpServer,
    autoAcceptConnections: false
  });

  wsServer.on('request', function(request) {
    const auth = _get(request, 'httpRequest.headers.authorization', '');
    const [username, password] = auth.split(':');
    if(!username || !password) {
      console.error('either id or secret missing in hub WS Req');
      return request.reject();
    }

    if(request.requestedProtocols.includes('myhomenew-device')) {
      return validateDeviceCreds(username, password)
        .then(obj => {
          const connection = request.accept('myhomenew-device', request.origin);
          return (obj.newKey ? 
            executeKeyUpdate(connection, obj.newKey, obj.device.otk) :
            Promise.resolve()
          )
            .then(() => ({ ...obj, connection }));
        })
        .then(obj => {
          // Do this conditionally is the device is in setup phase..
          return DeviceSetupModel.updateOne({
            _id: obj.device._id
          }, { 
            $set: { 
              name: obj.deviceName,
              encryptionKey: obj.newKey
            }
          }).exec()
            .then(() => obj);
        })
        .then(({connection, device, user}) => {
          if(user && device && connection && connection.connected) {
            return onDeviceConnect(connection, device, user);
          }

          if(!connection) {
            return request.reject();
          }
        })
        .catch(err => {
          console.log('device setup sequence failed', err.stack || err);
        });
    }

    return validateHubCreds(username, password)
      .then(user => {
        if(user) {
          const connection = request.accept('myhomenew', request.origin);
          return onHubConnect(connection, user);
        }
        return request.reject();
      })
  });
};
