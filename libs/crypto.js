'use strict';
const util = require('util');
const crypto = require('crypto');
const crRandomBytes = util.promisify(crypto.randomBytes);

/**
 * 
 * @param {Number} len : Number of random bytes required
 * @param {String} encoding : Format to return the bytes in. Falsey to return buffer.
 */
function randomBytes(len, encoding) {
  return crRandomBytes(len)
    .then(bytes => (encoding ? bytes.toString(encoding) : bytes));
}

/**
 * 
 * @param {String} plainText : Plain text to be encrypted
 * @param {String} key : Hex encoded key
 */
function encrypt(plainText, key) {
  // const paddingLen = plainText.length % 16 === 0 ? 0 : (16 - (plainText.length % 16));
  // if(paddingLen) {
  //   plainText = plainText + Array(paddingLen).fill(' ').join('');
  // }
  
  const secret = Buffer.from(key, 'hex');
  const IV = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-128-ctr', secret, IV);
  let encrypted = cipher.update(plainText);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return IV.toString('hex') + '-' + encrypted.toString('hex');
}

function decrypt(cipherText, key, encoding) {
  let [iv, encrypted] = cipherText.split('-');
  iv = Buffer.from(iv, 'hex');
  encrypted = Buffer.from(encrypted, 'hex');
  const secret = Buffer.from(key, 'hex');
  const deCipher = crypto.createDecipheriv('aes-128-ctr', secret, iv);
  let decrypted = deCipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, deCipher.final()]);
  return encoding ? decrypted.toString(encoding) : decrypted;
}

module.exports = {
  randomBytes,
  encrypt,
  decrypt
};
