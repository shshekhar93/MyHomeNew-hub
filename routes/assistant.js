'use strict';
const _get = require('lodash/get');
const { isDevOnline, proxy } = require('../libs/ws-server');
const {
  syncDevices, queryStatus, execute
} = require('../controllers/assistant');
const {
  revokeToken
} = require('../models/oAuth');
const { logInfo, logError } = require('../libs/logger');

function oAuthAuthenticate(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
  return req.app.oAuth.authenticate()(req, res, next);
}

module.exports =  app => {
  app.post('/assistant/fullfill', oAuthAuthenticate, (req, res) => {
    logInfo(`Assistant req ${JSON.stringify(req.body)}`);

    const hubClientId = _get(res,
      'locals.oauth.token.user.hubClientId',
      _get(req, 'user.hubClientId'));
    if(hubClientId && isDevOnline(hubClientId)) {
      return proxy(req, res);
    }
    
    const type = _get(req.body, 'inputs[0].intent');

    if(type === 'action.devices.SYNC') {
      return syncDevices(req, res);
    }

    if(type === 'action.devices.QUERY') {
      return queryStatus(req, res);
    }

    if(type === 'action.devices.EXECUTE') {
      return execute(req, res);
    }

    if(type === 'action.devices.DISCONNECT') {
      return revokeToken(_get(res, 'locals.oauth.token.refreshToken'))
        .catch(logError)
        .then(() => res.send({}));
    }

    // Invalid request
    return res.status(400).json({});
  });
}
