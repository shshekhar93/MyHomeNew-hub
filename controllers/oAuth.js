'use strict';
import bcrypt from 'bcrypt';
import { promisify } from 'util';
import uuid from 'uuid/v4.js';
import _omit from 'lodash/omit.js';
import _get from 'lodash/get.js';

import { getAllClientsForUser } from '../models/oAuth.js';
import {
  createClient,
  getUserFromClient,
  deleteClient
} from '../models/oAuth.js';

const hash = promisify(bcrypt.hash);

function getExistingClientsForUser(req, res) {
  if(!req.user._id) {
    return res.status(401).json([]);
  }

  getAllClientsForUser(req.user._id)
    .then(clients => {
      clients = clients.map(client => _omit(client, 'secret'));
      res.json(clients);
    })
    .catch(() => res.json([]));
}

async function deleteClientCreds(req, res) {
  if(!req.body.id) {
    return res.status(422).json({
      success: false,
      err: 'No client to delete'
    });
  }

  const user = await getUserFromClient({ id: req.body.id});
  if(!user) {
    return res.status(404).json({
      success: false,
      err: 'Client not found'
    });
  }

  if(`${user._id}` !== `${req.user._id}`) {
    return res.status(403).json({
      success: false,
      err: 'No permission to perform this action'
    });
  }

  deleteClient(req.body.id)
    .then(() => res.json({ success: true }))
    .catch(() => res.status(500).json({ success: false }));
}

function createNewClient(req, res) {
  const userId = _get(req, 'user._id');
  const { name, redirectUri } = req.body;

  if(!name || !redirectUri) {
    return res.status(403).json({ success: false, error: 'Invalid input' });
  }

  const id = uuid().replace(/-/g, '');
  const secret = uuid().replace(/-/g, '');
  const grants = [ 'client_credentials' ];
  const redirectUris = [ redirectUri ];
  return hash(secret, 8)
    .then(secret => createClient({name, id, secret, grants, redirectUris, userId}))
    .then(resp => res.json({ ...resp.toJSON(), secret, _id: undefined, __v: undefined }))
    .catch(err => res.status(500).json({ success: false, err: err.message }));
}

function renderAuthForm(req, res) {
  if(!req.isAuthenticated() || !req.user) {
    return res.redirect(`/login?redirectTo=${encodeURIComponent(req.originalUrl)}`)
  }

  const inputs = Object.keys(req.query).reduce((html, key) => 
    html + `<input type="hidden" name="${key}" value="${req.query[key]}" />`, '');
  res.type('html').send(`${AUTH_FORM_PREFIX}${inputs}${AUTH_FORM_SUFFIX}`);
}

function getAuthMiddleware(oAuth) {
  return oAuth.authorize({
    authenticateHandler: {
      handle: (req, res) => {
        return req.user;
      }
    }
  });
}

const AUTH_FORM_PREFIX = `<!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Authorize</title>
      <link rel="stylesheet" href="https://unpkg.com/bootstrap@4.1.0/dist/css/bootstrap.min.css" crossorigin="anonymous" />
    </head>
    <body>
      <div class="container" style="padding-top: 50px; text-align: center">
        <form action="/authorize" method="POST">
          <input type="hidden" name="grant_type" value="code" />
          <h4>Authorize Google assistant to control your devices</h4>`;
const AUTH_FORM_SUFFIX = `
          <button class="btn btn-primary" type="submit" style="margin-top: 30px;">Authorize</button>
        </form>
      </div>
    </body>
  </html>`;

  export {
    createNewClient,
    deleteClientCreds,
    getExistingClientsForUser,
    renderAuthForm,
    getAuthMiddleware
  };
