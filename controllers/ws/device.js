'use strict';
import { randomBytes } from '../../libs/crypto.js';
import { logInfo, logError } from '../../libs/logger.js';
import DeviceSetupModel from '../../models/device-setup.js';
import { sendMessageToDevice } from './helpers.js';

function confirmSessionKeyToDevice(conn, sessionKey) {
  const request = {
    action: 'confirm-session',
    data: sessionKey,
    'frame-num': 1,
  };
  return sendMessageToDevice(conn, request, sessionKey).catch((e) => {
    logError(`Device session key confirmation failed ${e.message}`);
    throw new Error('SESS_KEY_CONF_FAILED');
  });
}

function refreshKeyForDevice(conn, newKey, sessionKey) {
  const request = {
    action: 'update-key',
    data: newKey,
    'frame-num': 2,
  };

  return sendMessageToDevice(conn, request, sessionKey).catch((e) => {
    logError(`Device key update failed ${e.message}`);
    throw new Error('DEVICE_KEY_UPDATE_FAILED');
  });
}

function updateUserName(conn, newUsername, encryptionKey) {
  const request = {
    action: 'update-username',
    data: newUsername,
    'frame-num': 3,
  };
  return sendMessageToDevice(conn, request, encryptionKey).catch((e) => {
    logError(`Device username update failed ${e.message}`);
    throw new Error('DEVICE_USERNAME_UPDATE_FAILED');
  });
}

async function orchestrateInitialSetup(
  connection,
  sessionKey,
  { _id },
  deviceName
) {
  const newKey = await randomBytes(16, 'hex');
  await refreshKeyForDevice(connection, newKey, sessionKey);
  await updateUserName(connection, deviceName, sessionKey);
  await DeviceSetupModel.updateOne(
    {
      _id,
    },
    {
      $set: {
        name: deviceName,
        encryptionKey: newKey,
      },
    }
  );
}

async function onConnect(connection, emitter, device, sessionKey, deviceName) {
  await confirmSessionKeyToDevice(connection, sessionKey);

  // First time device setup
  if (deviceName && device.name !== deviceName) {
    await orchestrateInitialSetup(connection, sessionKey, device, deviceName);
    device.name = deviceName;
  }

  if (emitter.listenerCount(device.name) > 0) {
    logError(`${device.name} is already connected!`);
    return connection.close();
  }

  let frameNum = 10;
  const onRequest = async (reqData) => {
    const { cb } = reqData;
    reqData = {
      ...reqData,
      'frame-num': ++frameNum,
      cb: undefined,
    };

    try {
      const result = await sendMessageToDevice(connection, reqData, sessionKey);
      cb(null, result);
    } catch (err) {
      cb(err);
    }
  };

  emitter.on(device.name, onRequest);

  // We must receive periodic pings.
  connection.socket.setTimeout(45000, () => {
    connection.close();
  });

  // Clean up on socket disconnect.
  connection.on('close', () => {
    logInfo(`${device.name} disconnected!`);
    emitter.removeListener(device.name, onRequest);
  });

  logInfo(`${device.name} connected!`);
}

export {
  onConnect,
  confirmSessionKeyToDevice,
  refreshKeyForDevice,
  updateUserName,
};
