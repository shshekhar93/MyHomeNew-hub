const UserModel = require('../models/users');
const DeviceModel = require('../models/devices');
const DeviceSetupModel = require('../models/device-setup');
const Crypto = require('./crypto');

const { promisify } = require('util');
const compare = promisify(require('bcrypt').compare);

function validateHubCreds (hubClientId, hubClientSecret) {
  return UserModel.findOne({ hubClientId })
    .then(user => {
      if(!user) {
        throw new Error('User not found');
      }
      
      return compare(hubClientSecret, user.hubClientSecret)
        .then(isSame => (isSame ? user : null));
    })
    .catch(err => {
      console.error('Error', err.stack || err);
      return null;
    });
}

function decrypt(password, devices) {
  let deviceName = '';
  let sessionKey = '';
  const device = devices.find(({encryptionKey}) => {
    try {
      const decryptedPayload = Crypto.decrypt(password, encryptionKey, 'utf8');
      const parts = decryptedPayload.split('|');
      deviceName = parts[0].trim();
      sessionKey = parts[1].trim();
      return deviceName.startsWith('myhomenew') && sessionKey.length === 32;
    } catch(e) {
      return false;
    }
  });
  return device && { device, deviceName, sessionKey } || {};
}

function validateDeviceCreds(username, password) {
  return DeviceModel.findOne({ name: username })
    .then(device => {
      if(device) { // already added..
        const { deviceName, sessionKey } = decrypt(password, [device]);
        if(deviceName === username) {
          return Promise.all([device, UserModel.findOne({email: device.user})])
            .then(([device, user]) => ({ device, user, sessionKey }));
        }

        throw new Error('DECRYPTED_VALUE_DID_NOT_MATCH');
      }

      // New device
      let devAndUserPromise;
      if(username.startsWith('myhomenew-')) {
        devAndUserPromise = DeviceSetupModel.findOne({name: username}).lean()
          .then(device => Promise.all([device, UserModel.findOne({ _id: device.user })]))
          .then(([device, user]) => ({ devices: [device], user }));
      }
      else {
        devAndUserPromise = UserModel.findOne({ username }).lean()
          .then(user => Promise.all([user, DeviceSetupModel.find({user: user._id}).lean()]))
          .then(([user, devices]) => ({ devices, user }));
      }

      return devAndUserPromise.then(({devices, user}) => {
        const { device, deviceName, sessionKey } = decrypt(password, devices) || {};

        if(!device || !deviceName || !sessionKey) {
          throw new Error('DEVICE_PASSWORD_DECRYPTION_FAILED');
        }

        if((device.name || '').startsWith('myhomenew-')) {
          return { user, device, deviceName, sessionKey };
        }

        return Crypto.randomBytes(16, 'hex')
          .then(newKey => ({ user, device, deviceName, newKey, sessionKey }));
      });
    });
}

module.exports = {
  validateHubCreds,
  validateDeviceCreds
};