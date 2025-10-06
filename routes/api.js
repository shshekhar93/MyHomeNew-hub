'use strict';
import _get from 'lodash/get.js';
import _set from 'lodash/set.js';
import { isDevOnline, proxy } from '../controllers/ws/server.js';
import { appManifest, downloadApp } from '../controllers/app.js';
import {
  switchDeviceState,
  getAllDevicesForUser,
  queryDevice,
} from '../controllers/devices.js';

function applyReqUser(req, res, next) {
  const user = _get(res, 'locals.oauth.token.user');

  if (user && user.hubClientId && isDevOnline(user.hubClientId)) {
    return proxy(req, res);
  }

  _set(req, 'user', user);
  return next();
}

const setupAPIRoutes = (app) => {
  const oAuthenticate = app.oAuth.authenticate();

  const oAuth = (req, res, next) => {
    if (req.user) {
      _set(res, 'locals.oauth.token.user', req.user);
      return next();
    }
    return oAuthenticate(req, res, next);
  };

  app.get('/v1/devices', oAuth, applyReqUser, getAllDevicesForUser);
  app.get('/v1/devices/:name', oAuth, applyReqUser, queryDevice);
  app.post(
    '/v1/devices/:name/set-state',
    oAuth,
    applyReqUser,
    switchDeviceState,
  );

  app.get('/v1/app/latest-manifest', appManifest);
  app.get('/v1/app/download/:apk', downloadApp);
};

export default setupAPIRoutes;
