'use strict';
import { promisify } from 'util';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
const crRandomBytes = promisify(randomBytes);

/**
 *
 * @param {Number} len - Number of random bytes required
 * @param {string} encoding - Format to return the bytes in. Falsey to return buffer.
 * @return {string} - Buffer containing requested number of bytes, or string
 *                    representation of those bytes in provided encoding
 */
async function randomBytesStr(len, encoding) {
  const bytes = await crRandomBytes(len);
  return encoding ? bytes.toString(encoding) : bytes;
}

/**
 *
 * @param {string} plainText - Plain text to be encrypted
 * @param {string} key - Hex encoded key
 * @return {string} - Hex encoded IV and cipher text separated by hyphen
 */
function encrypt(plainText, key) {
  const secret = Buffer.from(key, 'hex');
  const IV = randomBytes(16);
  const cipher = createCipheriv('aes-128-ctr', secret, IV);
  let encrypted = cipher.update(plainText);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return IV.toString('hex') + '-' + encrypted.toString('hex');
}

/**
 *
 * @param {string} cipherText - Hex encoded IV and cipher text to be decrypted, separated by hyphen
 * @param {string} key - Hex encoded encryption key
 * @param {string} encoding - Optional encoding of plain text
 * @return {Buffer | string} String is returned if option encoding parameter is provided
 */
function decrypt(cipherText, key, encoding) {
  let [iv, encrypted] = cipherText.split('-');
  iv = Buffer.from(iv, 'hex');
  encrypted = Buffer.from(encrypted, 'hex');
  const secret = Buffer.from(key, 'hex');
  const deCipher = createDecipheriv('aes-128-ctr', secret, iv);
  let decrypted = deCipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, deCipher.final()]);
  return encoding ? decrypted.toString(encoding) : decrypted;
}

export { randomBytesStr as randomBytes, encrypt, decrypt };
