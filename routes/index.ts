'use strict';
import type { Application } from 'express';
import { createReadStream } from 'fs';
import setupAPIRoutes from './api.js';
import setupAppRoutes from './application.js';
import setupAssistantRoutes from './assistant.js';
import setupDevicesRoutes from './devices.js';
import setupLoginRoutes from './login.js';
import setupoAuthRoutes from './oAuth.js';
import setupUserRoutes from './users.js';
import { RootURL } from '../libs/esm-utils.js';

const RouteSetupFunctions = [
  setupAppRoutes,
  setupAPIRoutes,
  setupAssistantRoutes,
  setupDevicesRoutes,
  setupLoginRoutes,
  setupoAuthRoutes,
  setupUserRoutes,
];

const indexPath
  = process.env.NODE_ENV === 'production'
    ? new URL('./dist/index.html', RootURL)
    : new URL('./index.html', RootURL);

const setupRoutes = (app: Application) => {
  RouteSetupFunctions.forEach(fn => fn(app));

  app.use((_req, res) => createReadStream(indexPath).pipe(res.type('html')));
};

export { setupRoutes };
