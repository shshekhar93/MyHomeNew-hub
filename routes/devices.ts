'use strict';
import type { Application } from 'express';
import _get from 'lodash/get.js';
import { authorize } from '../libs/passport.js';
import { isDevOnline, proxy } from '../controllers/ws/server.js';
import streamFirmware from '../controllers/firmware.js';
import {
  getAvailableDevices,
  saveNewDeviceForUser,
  switchDeviceState,
  getDeviceConfig,
  getAllDevicesForUser,
  generateOTK,
  triggerFirmwareUpdate,
  updateExistingDevice,
} from '../controllers/devices.js';

const setupDevicesRoutes = (app: Application) => {
  app.use('/devices', authorize, function (req, res, next) {
    const hubClientId = _get(req, 'user.hubClientId');
    if (hubClientId && isDevOnline(hubClientId)) {
      return proxy(req, res);
    }
    return next();
  });

  app.get('/devices/available', authorize, getAvailableDevices);

  app.post('/devices', authorize, saveNewDeviceForUser);
  app.get('/devices', authorize, getAllDevicesForUser);

  app.post('/devices/new', authorize, generateOTK);

  app.post('/devices/:name', authorize, switchDeviceState);
  app.get('/devices/:name', authorize, getDeviceConfig);
  app.put('/devices/:name', authorize, updateExistingDevice);

  app.post('/devices/:name/update-firmware', authorize, triggerFirmwareUpdate);
  app.get('/v1/:name/get-firmware/:id', streamFirmware);
};

export default setupDevicesRoutes;
