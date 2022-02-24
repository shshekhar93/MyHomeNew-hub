import { promisify } from 'util';
import bcrypt from 'bcrypt';

import * as Crypto from '../../libs/crypto.js';
import { logError } from '../../libs/logger.js';
import UserModel from '../../models/users.js';
import DeviceModel from '../../models/devices.js';
import DeviceSetupModel from '../../models/device-setup.js';

const compare = promisify(bcrypt.compare);

async function authenticateHub(clientId, clientSecret) {
  try {
    const user = await UserModel.findOne({ clientId });
    if (!user) {
      throw new 'INVALID_HUB_CREDENTIALS'();
    }

    const match = compare(clientSecret, user.hubClientSecret);
    return match ? [user] : null;
  } catch (err) {
    logError(err);
    return null;
  }
}

/**
 *
 * @param {string} password
 * @param {Array<{encryptionKey: string}>} devices
 * @return {any}
 */
function decrypt(password, devices) {
  let deviceName = '';
  let sessionKey = '';
  const device = devices.find(({ encryptionKey }) => {
    try {
      const decryptedPayload = Crypto.decrypt(password, encryptionKey, 'utf8');
      [deviceName, sessionKey] = decryptedPayload
        .split('|')
        .map((s) => s.trim());
      return deviceName.startsWith('myhomenew') && sessionKey.length === 32;
    } catch (e) {
      return false;
    }
  });
  return device ? { device, deviceName, sessionKey } : {};
}

async function authenticateConfiguredDevice(username, authStr) {
  const device = await DeviceModel.findOne({ name: username });
  if (!device) return;

  const { deviceName, sessionKey } = decrypt(authStr, [device]);
  if (deviceName === username) {
    return [device, sessionKey];
  }
}

async function authenticatePendingDevice(username, authStr) {
  const device = await DeviceSetupModel.findOne({ name: username });
  if (!device) return;

  const { deviceName, sessionKey } = decrypt(authStr, [device]);

  if (deviceName === username) {
    return [device, sessionKey];
  }
}

async function authenticateNewDevice(username, authStr) {
  const user = await UserModel.findOne({ username });
  if (!user) return;

  const allDevices = await DeviceSetupModel.find({ user: user._id }).lean();
  const { device, deviceName, sessionKey } = decrypt(authStr, allDevices);

  if (device) {
    return [device, sessionKey, deviceName];
  }
}

/**
 * This function can take three paths
 * 1. Device already connected, and configured
 * 2. Device connected, but unconfigured
 * 3. New device connecting for firt time
 * For 1 & 2 this function just authenticates.
 * For 3 it starts the first time device setup sequence.
 * @param {string} username - Username provided by device
 * @param {string} authStr - Result of encrypt(`myhomenew-${chipID}-${sessionKey}`, PSK)
 */
async function authenticateDevice(username, authStr) {
  try {
    // Try configured devices.
    const result = await authenticateConfiguredDevice(username, authStr);
    if (result) {
      return result;
    }

    // Pending device
    if (username.startsWith('myhomenew-')) {
      return authenticatePendingDevice(username, authStr);
    }

    // First connection
    return authenticateNewDevice(username, authStr);
  } catch (err) {
    logError(err);
  }
}

export { authenticateHub, authenticateDevice };
