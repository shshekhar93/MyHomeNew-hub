'use strict';
import { createReadStream } from 'fs';
import setupAPIRoutes from './api.js';
import setupAssistantRoutes from './assistant.js';
import setupDevicesRoutes from './devices.js';
import setupLoginRoutes from './login.js';
import setupoAuthRoutes from './oAuth.js';
import setupUserRoutes from './users.js';

const RouteSetupFunctions = [
  setupAPIRoutes,
  setupAssistantRoutes,
  setupDevicesRoutes,
  setupLoginRoutes,
  setupoAuthRoutes,
  setupUserRoutes,
];

const setupRoutes = (app) => {
  RouteSetupFunctions.forEach((fn) => fn(app));

  app.use((req, res) =>
    createReadStream(new URL('../src/index.html', import.meta.url)).pipe(
      res.type('html')
    )
  );
};

export { setupRoutes };
