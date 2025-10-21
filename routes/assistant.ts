'use strict';
import type { Application, NextFunction, Request, Response } from 'express';
import _get from 'lodash/get.js';
import { logInfo, logError } from '../libs/logger.js';
import { isDevOnline, proxy } from '../controllers/ws/server.js';
import { syncDevices, queryStatus, execute } from '../controllers/assistant.js';
import { revokeToken } from '../models/oAuth.js';

function oAuthAuthenticate(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return req.app.oAuth.authenticate()(req, res, next);
}

const setupAssistantRoutes = (app: Application) => {
  app.post('/assistant/fullfill', oAuthAuthenticate, (req, res) => {
    logInfo(`Assistant req ${JSON.stringify(req.body)}`);

    const hubClientId = _get(
      res,
      'locals.oauth.token.user.hubClientId',
      _get(req, 'user.hubClientId'),
    );
    if (hubClientId && isDevOnline(hubClientId)) {
      return proxy(req, res);
    }

    const type = _get(req.body, 'inputs[0].intent');

    if (type === 'action.devices.SYNC') {
      return syncDevices(req, res);
    }

    if (type === 'action.devices.QUERY') {
      return queryStatus(req, res);
    }

    if (type === 'action.devices.EXECUTE') {
      return execute(req, res);
    }

    if (type === 'action.devices.DISCONNECT') {
      return (async () => {
        await revokeToken(_get(res, 'locals.oauth.token.refreshToken')).catch(
          logError,
        );
        return res.json({});
      })();
    }

    // Invalid request
    return res.status(400).json({});
  });
};

export default setupAssistantRoutes;
