import mongoose from 'mongoose';
import { promisify } from 'util';
import bcrypt from 'bcrypt';
import _get from 'lodash/get.js';
import _cloneDeep from 'lodash/cloneDeep.js';

import UserModel from './users.js';
import {
  logInfo,
  logError
} from '../libs/logger.js';

const {
  Schema
} = mongoose;
const compare = promisify(bcrypt.compare);

/**
 * Auth codes.
 */
const OAuthCodesModel = mongoose.model('OAuthCodes', new Schema({
  code: String,
  expiresAt: Date,
  redirectUri: String,
  client: String, // id from clients model
  user: String // id from users model
}));

function saveAuthorizationCode(code, client, user) {
  const { authorizationCode, expiresAt, redirectUri } = code;
  const authCodeDoc = new OAuthCodesModel({
    code: authorizationCode,
    expiresAt,
    redirectUri,
    client: client.id,
    user: user.email
  });
  return authCodeDoc.save()
    .then(authCode => {
      const resp = _cloneDeep(authCode.toJSON());
      return Object.assign(resp, {authorizationCode}, {client}, {user});
    })
}

function getAuthorizationCode(authorizationCode) {
  return OAuthCodesModel.findOne({code: authorizationCode})
    .then(authCode => {
      if(!authCode) {
        throw new Error('AUTH_CODE_NOT_FOUND');
      }

      return Promise.all([
        authCode,
        getClient(authCode.client),
        UserModel.findOne({email: authCode.user}).lean()
      ]);
    })
    .then(([authCode, client, user]) => Object.assign(
      authCode.toJSON(),
      {client},
      {user}
    ));
}

function revokeAuthorizationCode(code) {
  return new Promise(resolve => OAuthCodesModel.remove({code: code.code}, (err) => {
    resolve(!err);
  }))
}

/**
 * Clients
 */
const OAuthClientsModel = mongoose.model('OauthClients', new Schema({
  name: String,
  id: String,
  secret: String,
  redirectUris: [String],
  grants: [String],
  userId: String // _id from Users model
}));

function createClient(clientObj) {
  return (new OAuthClientsModel(clientObj)).save();
}

function getClient(id, secret) {
  return OAuthClientsModel.findOne({ id }).lean()
    .then(client => {
      if(id && !secret) {
        return [client, true];
      }
      return Promise.all([client, compare(secret, client.secret)]);
    })
    .then(result => {
      const client = result[0];
      const isSame = result[1];
      if(isSame) {
        return client;
      }
      logInfo(`wrong secret provided for ${id}`);
      return null;
    })
    .catch(err => {
      logError(err);
      return null;
    });
}

function getUserFromClient({ id }) {
  return OAuthClientsModel.findOne({ id }).lean()
    .then(client => {
      if(!client.userId) {
        return null;
      }
      return UserModel.findById(client.userId).lean();
    })
    .catch(() => null);
}

function getAllClientsForUser(userId) {
  return OAuthClientsModel.find({ userId }).lean()
    .catch(err => {
      logError(err);
      return [];
    });
}

function deleteClient(id) {
  return OAuthClientsModel.findOneAndRemove({ id }).lean();
}

/**
 * Tokens
 */
const OAuthTokensModel = mongoose.model('OauthTokens', new Schema({
  accessToken: String,
  accessTokenExpiresAt: Date,
  refreshToken: String,
  refreshTokenExpiresAt: Date,
  client: String, // client id from clients model
  user: String // id from users model
}));

function saveToken(token, client, user) {
  const tokenDoc = new OAuthTokensModel({
    ...token,
    client: client.id,
    user: user.email
  });

  return tokenDoc.save()
    .then(token => {
      const resp = _cloneDeep(token.toJSON());
      return Object.assign(resp, {client}, {user});
    })
}

function getAccessToken (bearerToken) {
  return OAuthTokensModel.findOne({
    accessToken: bearerToken
  })
    .then(token => Promise.all([
      token,
      _get(token, 'client') && getClient(token.client),
      _get(token, 'user') && UserModel.findOne({email: token.user}).lean()
    ]))
    .then(([token, client, user]) => {
      if (!token || !client || !user) {
        return null;
      }

      return Object.assign(token.toJSON(), { client, user });
    })
    .catch(err => {
      logError(err);
      return null;
    });
};

function revokeToken({ refreshToken }) {
  return new Promise(resolve => OAuthTokensModel.remove({
    refreshToken
  }, err => {
    resolve(!err);
  }));
}

function getRefreshToken(refreshToken) {
  return OAuthTokensModel.findOne({
    refreshToken
  })
    .then(token => Promise.all([
      token,
      _get(token, 'client') && getClient(token.client),
      _get(token, 'user') && UserModel.findOne({email: token.user}).lean()
    ]))
    .then(([token, client, user]) => Object.assign(
      token && token.toJSON(),
      {client},
      {user}
    ));
}

export {
  saveAuthorizationCode,
  getAuthorizationCode,
  revokeAuthorizationCode,
  createClient,
  getClient,
  saveToken,
  getAccessToken,
  getRefreshToken,
  revokeToken,
  getUserFromClient,
  getAllClientsForUser,
  deleteClient
};
