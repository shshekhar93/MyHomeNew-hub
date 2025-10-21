'use strict';
import EventEmitter from 'events';
import type { connection as WebsocketConnection } from 'websocket';
import _omit from 'lodash/omit.js';
import { randomBytes } from '../../libs/crypto.js';
import { logInfo, logError } from '../../libs/logger.js';
import DeviceSetupModel, { type DeviceSetupT } from '../../models/device-setup.js';
import type { DeviceModelT } from '../../models/devices.js';
import { sendMessageToDevice, type DeviceRequestCbT, type DeviceRequestT } from './helpers.js';
import type { BaseMongooseMixin } from '../../types/mongoose-mixins.js';

function confirmSessionKeyToDevice(conn: WebsocketConnection, sessionKey: string) {
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

function refreshKeyForDevice(conn: WebsocketConnection, newKey: string, sessionKey: string) {
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

function updateUserName(conn: WebsocketConnection, newUsername: string, encryptionKey: string) {
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
  connection: WebsocketConnection,
  sessionKey: string,
  { _id }: BaseMongooseMixin,
  deviceName: string,
) {
  const newKey = await randomBytes(16, 'hex' as const);
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
    },
  );
}

async function onConnect(connection: WebsocketConnection, emitter: EventEmitter, device: (DeviceModelT | DeviceSetupT) & BaseMongooseMixin, sessionKey: string, deviceName: string) {
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
  const onRequest = async (reqData: DeviceRequestT & DeviceRequestCbT) => {
    const { cb } = reqData;
    const reqDataUpdated = {
      ..._omit(reqData, 'cb'),
      'frame-num': ++frameNum,
    };

    try {
      const result = await sendMessageToDevice(connection, reqDataUpdated, sessionKey);
      cb(null, result);
    }
    catch (err) {
      cb(err as Error);
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
