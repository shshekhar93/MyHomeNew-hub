'use strict';
const crypto = require('crypto');

/**
 * 
 * @param {Number} len : Number of random bytes required
 * @param {String} encoding : Format to return the bytes in. Falsey to return buffer.
 */
function randomBytes(len, encoding) {
  return new Promise(resolve => {
    crypto.randomBytes(len, bytes => {
      if(!encoding) {
        return(resolve(bytes));
      }
      resolve(bytes.toString(encoding));
    });
  })
}

/**
 * 
 * @param {String} plainText : Plain text to be encrypted
 * @param {String} key : Hex encoded key
 */
function encrypt(plainText, key) {
  const secret = Buffer.from(key, 'hex');
  const IV = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(secret), IV);
  let encrypted = cipher.update(plainText);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return IV.toString('hex') + '-' + encrypted.toString('hex');
}

function decrypt(cipherText, key, encoding) {
  let [iv, encrypted] = cipherText.split('-');
  iv = Buffer.from(iv, 'hex');
  encrypted = Buffer.from(encrypted, 'hex');

  const secret = Buffer.from(key, 'hex');
  const deCipher = crypto.createDecipheriv('aes-128-cbc', secret, iv);
  let decrypted = deCipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, deCipher.final()]);
  return encoding ? decrypted.toString(encoding) : decrypted;
}

module.exports = {
  randomBytes,
  encrypt,
  decrypt
};
