'use strict';

import crypto from 'crypto';
import { readFile } from 'fs';

import DeviceModel from '../models/devices.js';
import { decrypt } from '../libs/crypto.js';
import { logError } from '../libs/logger.js';

const firmwareController = (req, res) => {
  // TODO: if current version same return 304

  const { name, id } = req.params;

  DeviceModel.findOne({name}).lean()
    .then(({encryptionKey}) => {
      if(!encryptionKey) {
        throw new Error('DEV_NOT_FOUND');
      }

      const decryptedTxt = decrypt(id, encryptionKey, 'utf8');
      const [filePath, frameNum] = decryptedTxt.split('-');

      if(!filePath || isNaN(frameNum)) {
        throw new Error('INVALID_ID_IN_REQ');
      }

      const fullURL = new URL(`../${filePath}`, import.meta.url);
      readFile(fullURL, function(err, buffer) {
        if(err) {
          logError(err);
          return;
        }

        const md5Hash = crypto.createHash('md5').update(buffer).digest('hex');

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename=firmware.bin');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('x-MD5', md5Hash);

        res.end(buffer);
      });
    })
    .catch(err => {
      logError(err);
      res.status(400).json({ error: err.message });
    });
};

export default firmwareController;
