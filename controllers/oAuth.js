'use strict';
import bcrypt from 'bcrypt';
import { promisify } from 'util';
import uuid from 'uuid/v4.js';
import _omit from 'lodash/omit.js';
import _get from 'lodash/get.js';

import { getAllClientsForUser, getClient } from '../models/oAuth.js';
import {
  createClient,
  getUserFromClient,
  deleteClient
} from '../models/oAuth.js';
import { errResp, successResp } from '../libs/helpers.js';

const hash = promisify(bcrypt.hash);

function getExistingClientsForUser(req, res) {
  if(!req.user._id) {
    return res.status(401).json([]);
  }

  getAllClientsForUser(req.user._id)
    .then(clients => {
      clients = clients.map(client => ({
        ..._omit(client, [
          '_id',
          '__v',
          'secret',
        ]),
        createdDate: client.createdDate || '1970-01-01T00:00:00.000Z'
      }));
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
/* @TODO: validate the responseType and redirectUri passed in query. */
async function getPublicClientDetails(req, res) {
  const { id } = req.params;
  try {
    const client = await getClient(id);

    if(!client) {
      return res.status(404).json(errResp({ client: null }));
    }

    if(!client.grants.includes('authorization_code')) {
      return res.status(403).json(errResp({ client: null }));
    }

    res.json(successResp({ client: _omit(client, [ '_id', '__v', 'secret' ]) }));
  } catch(err) {
    res.status(500).json(errResp({ err: err.message }));
  }
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

export {
  createNewClient,
  deleteClientCreds,
  getExistingClientsForUser,
  getAuthMiddleware,
  getPublicClientDetails,
};
