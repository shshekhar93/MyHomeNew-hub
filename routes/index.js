'use strict';
import { createReadStream } from 'fs';
import setupAPIRoutes from './api.js';
import setupAppRoutes from './application.js';
import setupAssistantRoutes from './assistant.js';
import setupDevicesRoutes from './devices.js';
import setupLoginRoutes from './login.js';
import setupoAuthRoutes from './oAuth.js';
import setupUserRoutes from './users.js';

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
    ? new URL('../dist/index.html', import.meta.url)
    : new URL('../index.html', import.meta.url);

const setupRoutes = (app) => {
  RouteSetupFunctions.forEach(fn => fn(app));

  app.use((_req, res) => createReadStream(indexPath).pipe(res.type('html')));
};

export { setupRoutes };
