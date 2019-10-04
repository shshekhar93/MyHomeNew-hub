const UserModel = require('../models/users');
const DeviceSetupModel = require('../models/device-setup');
const Crypto = require('./crypto');

const { promisify } = require('util');
const compare = promisify(require('bcrypt').compare);

function validateHubCreds (hubClientId, hubClientSecret) {
  return UserModel.findOne({ hubClientId, hubClientSecret })
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
  const device = devices.find(({otk}) => {
    try {
      deviceName = Crypto.decrypt(password, otk, 'utf8');
      return deviceName.startsWith('myhomenew');
    } catch(e) {
      return false;
    }
  });
  return device && { device, deviceName };
}

function validateDeviceCreds(username, password) {
  if(username.startsWith('myhomenew-')) {
    // Already setup device.
  }

  return UserModel.findOne({ username }).lean()
    .then(user => {
      return DeviceSetupModel.find({user: user._id}).lean()
        .then(devices => {
          const { device, deviceName } = decrypt(password, devices) || {};

          if(!device || !deviceName) {
            throw new Error('DEVICE_PASSWORD_DECRYPTION_FAILED');
          }

          return Crypto.randomBytes(16, 'hex')
            .then(newKey => ({ user, device, deviceName, newKey}));
        });
    });
}

module.exports = {
  validateHubCreds,
  validateDeviceCreds
};