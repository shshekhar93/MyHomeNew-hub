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
import { catchAndRespond, errResp, successResp } from '../libs/helpers.js';

const hash = promisify(bcrypt.hash);
const mapper = client => _omit(client, [ '_id', '__v', 'secret' ]);

const getExistingClientsForUser = async (req, res) => {
  if(!req.user._id) {
    return res.status(401).json([]);
  }

  try {
    const clients = (await getAllClientsForUser(req.user._id))
      .map(client => ({
        ...mapper(client),
        createdDate: client.createdDate || '1970-01-01T00:00:00.000Z'
      }));
    res.json(clients);
  } catch(e) {
    res.json([]);
  }
};

const deleteClientCreds = catchAndRespond(async (req, res) => {
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

  await deleteClient(req.body.id);
  res.json(successResp());
});

const createNewClient = catchAndRespond(async (req, res) => {
  const userId = _get(req, 'user._id');
  const { name, redirectUri } = req.body;

  if(!name || !redirectUri) {
    return res.status(403).json(errResp({
      error: 'Invalid input'
    }));
  }

  const clientObj = {
    name,
    id: uuid().replace(/-/g, ''),
    secret: uuid().replace(/-/g, ''),
    grants: [ 'client_credentials' ],
    redirectUris: [ redirectUri ],
    userId
  };
  
  const hashedSecret = await hash(clientObj.secret, 8);
  await createClient({
    ...clientObj,
    secret: hashedSecret
  });
  res.json(clientObj);
});

/* @TODO: validate the responseType and redirectUri passed in query. */
const getPublicClientDetails = catchAndRespond(async (req, res) => {
  const { id } = req.params;
  const client = await getClient(id);

  if(!client) {
    return res.status(404).json(errResp({ client: null }));
  }

  if(!client.grants.includes('authorization_code')) {
    return res.status(403).json(errResp({ client: null }));
  }

  res.json(successResp({
    client: mapper(client)
  }));
});

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
