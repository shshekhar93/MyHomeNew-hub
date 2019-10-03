const UserModel = require('../models/users');
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

function validateDeviceCreds(username, password) {

}

module.exports = {
  validateHubCreds,
  validateDeviceCreds
};