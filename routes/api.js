'use strict';
const _set = require('lodash/set');
const _get = require('lodash/get');

const { 
  switchDeviceState,
  getAllDevicesForUser,
  queryDevice
} = require('../controllers/devices');

function applyReqUser(req, res) {
  const user = _get(res, 'locals.oauth.token.user');
  _set(req, 'user', user);
}

module.exports = app => {
  const oAuth = app.oAuth.authenticate();

  app.get('/v1/devices', oAuth, applyReqUser, getAllDevicesForUser);
  app.get('/v1/devices/:name', oAuth, applyReqUser, queryDevice);
  app.post('/v1/devices/:name/set-state', oAuth, applyReqUser, switchDeviceState);
};