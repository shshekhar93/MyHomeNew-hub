'use strict';
const { authorize } = require('../libs/passport');
const {
  getExistingClientsForUser,
  createNewClient,
  deleteClientCreds,
  renderAuthForm,
  getAuthMiddleware
} = require('../controllers/oAuth');

module.exports = app => {
  app.get('/authorize', renderAuthForm);
  app.post('/authorize', authorize, getAuthMiddleware(app.oAuth));
  app.post('/token', app.oAuth.token());
  app.post('/create-client', authorize, createNewClient);
  app.get('/existing-clients', authorize, getExistingClientsForUser);
  app.post('/delete-client', authorize, deleteClientCreds);
};
