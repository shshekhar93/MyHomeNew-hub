'use strict';
import bcrypt from 'bcrypt';
import { promisify } from 'util';
import { v4 as uuid } from 'uuid';
import _omit from 'lodash/omit.js';
import _get from 'lodash/get.js';

import {
  getAllClientsForUser,
  getClient,
  createClient,
  getUserFromClient,
  deleteClient,
  type OAuthClientT,
} from '../models/oAuth.js';
import { catchAndRespond, errResp, successResp } from '../libs/helpers.js';
import type { Request, Response } from 'express';
import type ExpressOAuthServer from 'express-oauth-server';

const hash = promisify(bcrypt.hash);
const mapper = (client: OAuthClientT) => _omit(client, ['_id', '__v', 'secret']);

const getExistingClientsForUser = async (req: Request, res: Response) => {
  if (!req.user?._id) {
    return res.status(401).json([]);
  }

  try {
    const clients = (await getAllClientsForUser(req.user._id)).map(
      client => ({
        ...mapper(client),
        createdDate: client.createdDate || '1970-01-01T00:00:00.000Z',
      }),
    );
    res.json(clients);
  }
  catch (_) {
    res.json([]);
  }
};

const deleteClientCreds = catchAndRespond(async (req, res) => {
  if (!req.body.id) {
    return res.status(422).json({
      success: false,
      err: 'No client to delete',
    });
  }

  const user = await getUserFromClient({ id: req.body.id });
  if (!user) {
    return res.status(404).json({
      success: false,
      err: 'Client not found',
    });
  }

  if (`${user._id}` !== `${req.user?._id}`) {
    return res.status(403).json({
      success: false,
      err: 'No permission to perform this action',
    });
  }

  await deleteClient(req.body.id);
  res.json(successResp());
});

const createNewClient = catchAndRespond(async (req, res) => {
  const userId = _get(req, 'user._id')!;
  const { name, redirectUri } = req.body;

  if (!name || !redirectUri) {
    return res.status(403).json(
      errResp({
        error: 'Invalid input',
      }),
    );
  }

  const clientObj = {
    name,
    id: uuid().replace(/-/g, ''),
    secret: uuid().replace(/-/g, ''),
    grants: ['client_credentials'] as [string],
    redirectUris: [redirectUri] as [string],
    userId,
  };

  const hashedSecret = await hash(clientObj.secret, 8);
  await createClient({
    ...clientObj,
    secret: hashedSecret,
  });
  res.json(clientObj);
});

/* @TODO: validate the responseType and redirectUri passed in query. */
const getPublicClientDetails = catchAndRespond(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json(errResp({ client: null }));
  }

  const client = await getClient(id, '');
  if (!client) {
    return res.status(404).json(errResp({ client: null }));
  }

  if (!client.grants.includes('authorization_code')) {
    return res.status(403).json(errResp({ client: null }));
  }

  res.json(
    successResp({
      client: mapper(client as OAuthClientT),
    }),
  );
});

function getAuthMiddleware(oAuth: ExpressOAuthServer) {
  return oAuth.authorize({
    authenticateHandler: {
      handle: (req: Request, _res: Response) => {
        return req.user;
      },
    },
  });
}

export {
  createNewClient,
  deleteClientCreds,
  getExistingClientsForUser,
  getAuthMiddleware,
  getPublicClientDetails,
};
