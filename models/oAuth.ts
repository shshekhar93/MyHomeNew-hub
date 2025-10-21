import mongoose from 'mongoose';
import { promisify } from 'util';
import bcrypt from 'bcrypt';

import UserModel from './users.js';
import { logInfo, logError } from '../libs/logger.js';

import type { AuthorizationCodeModel, BaseModel, RefreshTokenModel, RequestAuthenticationModel } from 'oauth2-server';

const { Schema } = mongoose;
const compare = promisify(bcrypt.compare);

/**
 * Auth codes.
 */
export type OAuthCodeT = {
  code: string;
  expiresAt: Date;
  redirectUri: string;
  client: string;
  user: string;
  createdDate: Date;
};
const OAuthCodesModel = mongoose.model<OAuthCodeT>(
  'OAuthCodes',
  new Schema({
    code: String,
    expiresAt: Date,
    redirectUri: String,
    client: String, // id from clients model
    user: String, // email from users model
    createdDate: { type: Date, default: Date.now },
  }),
);

const saveAuthorizationCode: AuthorizationCodeModel['saveAuthorizationCode'] = async function (code, client, user) {
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
};

const getAuthorizationCode: AuthorizationCodeModel['getAuthorizationCode'] = async function (authorizationCode) {
  const authCode = await OAuthCodesModel.findOne({ code: authorizationCode });
  if (!authCode) {
    throw new Error('AUTH_CODE_NOT_FOUND');
  }

  const client = await getClient(authCode.client, '');
  const user = await UserModel.findOne({ email: authCode.user }).lean();

  if (!client || !user) {
    throw new Error('AUTH_CODE_INVALID');
  }

  return {
    ...authCode.toJSON(),
    authorizationCode: authCode.code,
    client,
    user,
  };
};

const revokeAuthorizationCode: AuthorizationCodeModel['revokeAuthorizationCode'] = function (code) {
  return new Promise(resolve =>
    OAuthCodesModel.remove({ code: code.code }, (err) => {
      resolve(!err);
    }),
  );
};

/**
 * Clients
 */
export type OAuthClientT = {
  name: string;
  id: string;
  secret: string;
  redirectUris: [string];
  grants: [string];
  accessTokenLifetime: number;
  refreshTokenLifetime: number;
  userId: string; // _id from Users model
  createdDate: Date;
};

const OAuthClientsModel = mongoose.model<OAuthClientT>(
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
  }),
);

function createClient(clientObj: Omit<OAuthClientT, 'accessTokenLifetime' | 'refreshTokenLifetime' | 'createdDate'> & Partial<OAuthClientT>) {
  return new OAuthClientsModel(clientObj).save();
}

const getClient: AuthorizationCodeModel['getClient'] = async function (id, secret) {
  try {
    const client = await OAuthClientsModel.findOne({ id }).lean();
    if (!secret || !client) {
      return client;
    }

    const isSame = await compare(secret, client.secret);

    if (!isSame) {
      logInfo(`wrong secret provided for ${id}`);
      return null;
    }

    return client;
  }
  catch (err) {
    logError(err);
    return null;
  }
};

async function getUserFromClient({ id }: { id: string }) {
  try {
    const client = await OAuthClientsModel.findOne({ id }).lean();
    if (!client || !client.userId) {
      return null;
    }

    return UserModel.findById(client.userId);
  }
  catch (err) {
    logError(err);
    return null;
  }
}

async function getAllClientsForUser(userId: string) {
  try {
    return await OAuthClientsModel.find({ userId }).lean();
  }
  catch (err) {
    logError(err);
    return [];
  }
}

async function deleteClient(id: string) {
  return OAuthClientsModel.findOneAndRemove({ id }).lean();
}

/**
 * Tokens
 */
export type OAuthTokenT = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  client: string; // client id from clients model
  user: string; // email from users model
  createdDate: Date;
};
const OAuthTokensModel = mongoose.model<OAuthTokenT>(
  'OauthTokens',
  new Schema({
    accessToken: String,
    accessTokenExpiresAt: Date,
    refreshToken: String,
    refreshTokenExpiresAt: Date,
    client: String, // client id from clients model
    user: String, // id from users model
    createdDate: { type: Date, default: Date.now },
  }),
);

const saveToken: BaseModel['saveToken'] = async function (token, client, user) {
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
};

const getAccessToken: RequestAuthenticationModel['getAccessToken'] = async function (accessToken) {
  try {
    const token = await OAuthTokensModel.findOne({ accessToken });
    if (!token || !token.client || !token.user) {
      logError(`Invalid token provided ${accessToken}.`);
      return null;
    }

    const client = await getClient(token.client, '');
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
  }
  catch (err) {
    logError(err);
    return null;
  }
};

const revokeToken: RefreshTokenModel['revokeToken'] = function ({ refreshToken }) {
  return new Promise(resolve =>
    OAuthTokensModel.remove(
      {
        refreshToken,
      },
      (err) => {
        resolve(!err);
      },
    ),
  );
};

const getRefreshToken: RefreshTokenModel['getRefreshToken'] = async function (refreshToken) {
  try {
    const token = await OAuthTokensModel.findOne({ refreshToken });
    if (!token || !token.client || !token.user) {
      return null;
    }

    const client = await getClient(token.client, '');
    const user = await UserModel.findOne({ email: token.user }).lean();

    if (!client || !user) {
      return null;
    }

    return {
      ...token.toJSON(),
      client,
      user,
    };
  }
  catch (err) {
    logError(err);
    return null;
  }
};

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
