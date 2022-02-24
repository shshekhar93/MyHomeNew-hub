'use strict';

import crypto from 'crypto';
import { readFile } from 'fs/promises';

import DeviceModel from '../models/devices.js';
import { decrypt } from '../libs/crypto.js';
import { catchAndRespond } from '../libs/helpers.js';

const firmwareController = catchAndRespond(async (req, res) => {
  const { name, id } = req.params;

  const { encryptionKey } = await DeviceModel.findOne({name}).lean() || {};
  if(!encryptionKey) {
    throw new Error('DEV_NOT_FOUND');
  }

  const decryptedTxt = decrypt(id, encryptionKey, 'utf8');
  const [filePath, frameNum] = decryptedTxt.split('-');

  if(!filePath || isNaN(frameNum)) {
    throw new Error('INVALID_ID_IN_REQ');
  }

  const fullURL = new URL(`../${filePath}`, import.meta.url);
  const buffer = await readFile(fullURL);
  const md5Hash = crypto.createHash('md5')
    .update(buffer).digest('hex');

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename=firmware.bin');
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('x-MD5', md5Hash);

  res.end(buffer);
});

export default firmwareController;
