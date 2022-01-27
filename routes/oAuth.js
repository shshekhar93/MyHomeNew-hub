'use strict';
import { authorize } from '../libs/passport.js';
import {
  getExistingClientsForUser,
  createNewClient,
  deleteClientCreds,
  renderAuthForm,
  getAuthMiddleware
} from '../controllers/oAuth.js';

const setupoAuthRoutes = app => {
  app.get('/authorize', renderAuthForm);
  app.post('/authorize', authorize, getAuthMiddleware(app.oAuth));
  app.post('/token', app.oAuth.token());
  app.post('/create-client', authorize, createNewClient);
  app.get('/existing-clients', authorize, getExistingClientsForUser);
  app.post('/delete-client', authorize, deleteClientCreds);
};

export default setupoAuthRoutes;
