import { serveTranslations } from '../controllers/application.js';

function setupAppRoutes(app) {
  app.get('/translations', serveTranslations);
}

export default setupAppRoutes;
