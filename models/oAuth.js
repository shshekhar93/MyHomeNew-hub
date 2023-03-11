import mongoose from 'mongoose';
import { promisify } from 'util';
import bcrypt from 'bcrypt';

import UserModel from './users.js';
import { logInfo, logError } from '../libs/logger.js';

const { Schema } = mongoose;
const compare = promisify(bcrypt.compare);

/**
 * Auth codes.
 */
const OAuthCodesModel = mongoose.model(
  'OAuthCodes',
  new Schema({
    code: String,
    expiresAt: Date,
    redirectUri: String,
    client: String, // id from clients model
    user: String, // email from users model
    createdDate: { type: Date, default: Date.now },
  })
);

async function saveAuthorizationCode(code, client, user) {
  const { authorizationCode, expiresAt, redirectUri } = code;
  const authCodeDoc = new OAuthCodesModel({
    code: authorizationCode,
    expiresAt,
    redirectUri,
    client: client.id,
    user: user.email,
  });
  const authCode = await authCodeDoc.save();

  return {
    ...authCode.toJSON(),
    authorizationCode,
    client,
    user,
  };
}

async function getAuthorizationCode(authorizationCode) {
  const authCode = await OAuthCodesModel.findOne({ code: authorizationCode });
  if (!authCode) {
    throw new Error('AUTH_CODE_NOT_FOUND');
  }

  const client = await getClient(authCode.client);
  const user = await UserModel.findOne({ email: authCode.user }).lean();

  return {
    ...authCode.toJSON(),
    client,
    user,
  };
}

function revokeAuthorizationCode(code) {
  return new Promise((resolve) =>
    OAuthCodesModel.remove({ code: code.code }, (err) => {
      resolve(!err);
    })
  );
}

/**
 * Clients
 */
const OAuthClientsModel = mongoose.model(
  'OauthClients',
  new Schema({
    name: String,
    id: String,
    secret: String,
    redirectUris: [String],
    grants: [String],
    accessTokenLifetime: { type: Number, default: 0 },
    refreshTokenLifetime: { type: Number, default: 0 },
    userId: String, // _id from Users model
    createdDate: { type: Date, default: Date.now },
  })
);

function createClient(clientObj) {
  return new OAuthClientsModel(clientObj).save();
}

async function getClient(id, secret) {
  try {
    const client = await OAuthClientsModel.findOne({ id }).lean();
    if (id && !secret) {
      return client;
    }

    const isSame = await compare(secret, client.secret);

    if (!isSame) {
      logInfo(`wrong secret provided for ${id}`);
      return null;
    }

    return client;
  } catch (err) {
    logError(err);
    return null;
  }
}

async function getUserFromClient({ id }) {
  try {
    const client = await OAuthClientsModel.findOne({ id }).lean();
    if (!client.userId) {
      return null;
    }

    return await UserModel.findById(client.userId).lean();
  } catch (err) {
    logError(err);
    return null;
  }
}

async function getAllClientsForUser(userId) {
  try {
    return await OAuthClientsModel.find({ userId }).lean();
  } catch (err) {
    logError(err);
    return [];
  }
}

async function deleteClient(id) {
  return OAuthClientsModel.findOneAndRemove({ id }).lean();
}

/**
 * Tokens
 */
const OAuthTokensModel = mongoose.model(
  'OauthTokens',
  new Schema({
    accessToken: String,
    accessTokenExpiresAt: Date,
    refreshToken: String,
    refreshTokenExpiresAt: Date,
    client: String, // client id from clients model
    user: String, // id from users model
    createdDate: { type: Date, default: Date.now },
  })
);

async function saveToken(token, client, user) {
  const tokenDoc = new OAuthTokensModel({
    ...token,
    client: client.id,
    user: user.email,
  });

  const tokenResp = await tokenDoc.save();
  return {
    ...tokenResp.toJSON(),
    client,
    user,
  };
}

async function getAccessToken(accessToken) {
  try {
    const token = await OAuthTokensModel.findOne({ accessToken });
    if (!token || !token.client || !token.user) {
      logError(`Invalid token provided ${accessToken}.`);
      return null;
    }

    const client = await getClient(token.client);
    const user = await UserModel.findOne({ email: token.user }).lean();

    if (!client || !user) {
      logError('unable to find token owner.');
      return null;
    }

    return {
      ...token.toJSON(),
      client,
      user,
    };
  } catch (err) {
    logError(err);
    return null;
  }
}

function revokeToken({ refreshToken }) {
  return new Promise((resolve) =>
    OAuthTokensModel.remove(
      {
        refreshToken,
      },
      (err) => {
        resolve(!err);
      }
    )
  );
}

async function getRefreshToken(refreshToken) {
  try {
    const token = await OAuthTokensModel.findOne({ refreshToken });
    if (!token || !token.client || !token.user) {
      return null;
    }

    const client = await getClient(token.client);
    const user = await UserModel.findOne({ email: token.user }).lean();

    if (!client || !user) {
      return null;
    }

    return {
      ...token.toJSON(),
      client,
      user,
    };
  } catch (err) {
    logError(err);
    return null;
  }
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
  deleteClient,
};
