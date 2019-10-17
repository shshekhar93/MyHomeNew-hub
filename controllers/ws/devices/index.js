'use strict';
const uuid = require('uuid/v4');
const { encrypt, decrypt } = require('../../../libs/crypto');

function sendMessageToDevice(conn, obj, key, decryptionKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(obj);
    const encryptedPayload = encrypt(payload, key);
    let cleanupTimeoutId;

    function onMsg(message) {
      clearTimeout(cleanupTimeoutId);
      try {
        const resp = JSON.parse(decrypt(message.utf8Data, decryptionKey || key));
        if(resp.status === 'OK') {
          return resolve(resp);
        }
        return reject(new Error('DEV_REPORTED_ERR'));
      } catch(e) {
        return reject(new Error('COULDNT_PARSE_MSG'));
      }
    }
    
    function cleanup (shouldReject = true) {
      conn.removeListener('message', onMsg);
      if (shouldReject) {
        return reject(new Error('WS_WAIT_TIMEOUT'));
      }
    };

    cleanupTimeoutId = setTimeout(cleanup, 5000);
    conn.once('message', onMsg);
    conn.send(encryptedPayload);
  });
}

function confirmSessionKeyToDevice(conn, sessionKey) {
  const request = {
    action: 'confirm-session',
    data: sessionKey,
    'frame-num': 1
  };
  return sendMessageToDevice(conn, request, sessionKey)
    .catch(e => {
      console.error('DEV_SESS_KEY_CONF', e.message);
      throw new Error('SESS_KEY_CONF_FAILED');
    });
}

function refreshKeyForDevice(conn, newKey, sessionKey) {
  const request = {
    action: 'update-key',
    data: newKey,
    'frame-num': 2
  };

  return sendMessageToDevice(conn, request, sessionKey)
    .catch(e => {
      console.error('DEV_KEY_UPDATE', e.message);
      throw new Error('DEVICE_KEY_UPDATE_FAILED');
    });
}

function updateUserName(conn, newUsername, encryptionKey) {
  const request = {
    action: 'update-username',
    data: newUsername,
    'frame-num': 3
  };
  return sendMessageToDevice(conn, request, encryptionKey)
    .catch(e => {
      console.error('DEV_USER_UPDATE', e.message);
      throw new Error('DEVICE_USERNAME_UPDATE_FAILED');
    });
}

function onConnect(connection, sessionKey, emitter, device) {
  if(emitter.listenerCount(device.name) > 0) {
    console.error('device is already connected!');
    return connection.close();
  }

  let frameNum = 10;
  const onRequest = reqData => {
    const { cb } = reqData;
    reqData = {
      ...reqData,
      'frame-num': ++frameNum,
      cd: undefined
    };
    sendMessageToDevice(connection, reqData, sessionKey)
      .then(cb.bind(null, null))
      .catch(cb);
  };

  emitter.on(device.name, onRequest);

  // We must receive periodic pings.
  connection.socket.setTimeout(45000, () => {
    connection.close();
  });

  // Clean up on socket disconnect.
  connection.on('close', () => {
    console.log(new Date(), 'device disconnected!');
    emitter.removeListener(device.name, onRequest);
  });

  console.log(new Date(), 'device connected!');
}

module.exports = {
  onConnect,
  confirmSessionKeyToDevice,
  refreshKeyForDevice,
  updateUserName
};
