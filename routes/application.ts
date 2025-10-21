import type { Application } from 'express';
import { serveTranslations } from '../controllers/application.js';

function setupAppRoutes(app: Application) {
  app.get('/translations', serveTranslations);
}

export default setupAppRoutes;
