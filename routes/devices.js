'use strict';
const _get = require('lodash/get');
const { authorize } = require('../libs/passport');
const { 
  getAvailableDevices, 
  saveNewDeviceForUser, 
  switchDeviceState, 
  getDeviceConfig, 
  getAllDevicesForUser,
  generateOTK
} = require('../controllers/devices');
const { isDevOnline, proxy } = require('../libs/ws-server');

module.exports = (app) => {
  app.use('/devices', authorize, function(req, res, next) {
    const hubClientId = _get(req, 'user.hubClientId');
    if(hubClientId && isDevOnline(hubClientId)) {
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
};
