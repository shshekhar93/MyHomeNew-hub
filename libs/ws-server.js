'use strict';
const WebsocketServer = require('websocket').server;
const _get = require('lodash/get');
const EventEmitter = require('events');
const {
  confirmSessionKeyToDevice,
  refreshKeyForDevice,
  updateUserName,
  onConnect: onDeviceConnect
} = require('../controllers/ws/devices');
const onHubConnect = require('../controllers/ws/devices/hub');

const { validateHubCreds, validateDeviceCreds } = require('./ws-helpers');
const DeviceSetupModel = require('../models/device-setup');
const JSON_TYPE = 'application/json';

const emitter = new EventEmitter();

module.exports.isDevOnline = function (name) {
  return emitter.listenerCount(name) > 0;
}

module.exports.requestToDevice = function (name, obj) {
  return new Promise((resolve, reject) => {
    emitter.emit(name, {
      ...obj,
      cb: (err, resp) => {
        if(err) { return reject(err); }
        return resolve(resp);
      }
    })
  })
}

module.exports.proxy = function(req, res) {
  const hubClientId = _get(req, 'user.hubClientId') || 
    _get(res, 'locals.oauth.token.user.hubClientId');

  if(emitter.listenerCount(hubClientId) === 0) {
    // We should at least retry once in a second or so!!
    return res.status(503).end(); // Server is unavailable.
  }

  emitter.emit(hubClientId, {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    type: req.get('content-type'),
    cb: (err, resp) => {
      if(err) {
        return res.status(500).end();
      }
      const respPayload = typeof resp.body !== 'string' ? JSON.stringify(resp.body) : resp.body; 
      res.status(resp.status || 200).type(req.type || JSON_TYPE).end(respPayload);
    }
  });
};

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
        .catch(err => {
          request.reject();
          throw err;
        })
        .then(obj => {
          const connection = request.accept('myhomenew-device', request.origin);

          // Event emitters must have an error event handler.
          connection.on('error', err => {
            console.error('Hub connection error', err.message);
          });

          return confirmSessionKeyToDevice(connection, obj.sessionKey)
            .then(() => {
              if(!obj.newKey) {
                return Promise.resolve({ ...obj, connection });
              }
              return refreshKeyForDevice(connection, obj.newKey, obj.device.encryptionKey)
                .then(() => updateUserName(connection, obj.deviceName, obj.newKey));
            })
            .then(() => ({ ...obj, connection }))
            .catch(e => {
              connection.close();
              throw e;
            });
        })
        .then(obj => {
          if(!obj.newKey) {
            return obj;
          }
          
          return DeviceSetupModel.updateOne({
            _id: obj.device._id
          }, { 
            $set: { 
              name: obj.deviceName,
              encryptionKey: obj.newKey,
              type: _get(request, 'httpRequest.headers.type', 'switch')
            }
          }).exec()
            .then(() => obj);
        })
        .then(({ connection, device, user, sessionKey }) => {
          if(user && device && sessionKey && connection && connection.connected) {
            return onDeviceConnect(connection, sessionKey, emitter, device, user);
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

          // Event emitters must have an error event handler.
          connection.on('error', err => {
            console.error('Hub connection error', err.message);
          });

          return onHubConnect(connection, emitter, user);
        }
        return request.reject();
      })
  });
};
