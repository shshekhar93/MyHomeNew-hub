import mongoose from 'mongoose';
import {
  createClient,
  deleteClient,
  getAccessToken,
  getAllClientsForUser,
  getAuthorizationCode,
  getClient,
  getRefreshToken,
  getUserFromClient,
  revokeAuthorizationCode,
  revokeToken,
  saveAuthorizationCode,
  saveToken,
} from '../oAuth';
import { injectLean } from '../../test/test-utils';
// import.require('../users');

const MOCK_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
};

jest.mock('mongoose', () => {
  const allModels = {};
  return {
    model: (name) => {
      if (allModels[name]) {
        return allModels[name];
      }

      const Model = function (obj) {
        Object.assign(this, obj);
      };
      const DefaultSaveImpl = async function () {
        return this;
      };
      allModels[name] = Model;
      Model.prototype.save = jest.fn(DefaultSaveImpl);
      Model.prototype.toJSON = function () {
        return { ...this, toJSON: undefined };
      };
      Model.find = jest.fn();
      Model.findOne = jest.fn();
      Model.findById = jest.fn();
      Model.findOneAndRemove = jest.fn();
      Model.remove = jest.fn();
      return Model;
    },
    Schema: function () {},
  };
});

describe('OAuthCodesModel tests', () => {
  const OAuthCodesModel = mongoose.model('OAuthCodes');
  const OAuthClientsModel = mongoose.model('OauthClients');
  const UserModel = mongoose.model('Users');

  const mockCode = {
    authorizationCode: 'test-auth-code',
    expiresAt: 1234,
    redirectUri: 'https://example.com',
  };

  const mockClient = {
    id: 'test-client',
  };

  it('Should save authorization code', async () => {
    const result = await saveAuthorizationCode(mockCode, mockClient, MOCK_USER);
    expect(result).toEqual({
      ...mockCode,
      code: mockCode.authorizationCode,
      client: mockClient,
      user: MOCK_USER,
      toJSON: undefined,
    });
  });

  it('Should handle save authorization code error', async () => {
    const dbError = new Error('db unavailable');
    OAuthCodesModel.prototype.save.mockImplementation(() =>
      Promise.reject(dbError),
    );
    await expect(() =>
      saveAuthorizationCode(mockCode, mockClient, MOCK_USER),
    ).rejects.toThrow(dbError);
  });

  it('Should get authorization code', async () => {
    const authCode = {
      ...mockCode,
      client: mockClient.id,
      user: MOCK_USER.email,
      toJSON: () => mockCode,
    };

    OAuthCodesModel.findOne.mockImplementation(async () => authCode);
    OAuthClientsModel.findOne.mockImplementation(
      injectLean(async () => mockClient),
    );
    UserModel.findOne.mockImplementation(injectLean(async () => MOCK_USER));
    const result = await getAuthorizationCode(authCode.authorizationCode);
    expect(result).toStrictEqual({
      ...mockCode,
      client: mockClient,
      user: MOCK_USER,
    });
  });

  it('Should handle auth code not found', async () => {
    OAuthCodesModel.findOne.mockImplementation(async () => null);
    await expect(() => getAuthorizationCode('test')).rejects.toThrow(
      'AUTH_CODE_NOT_FOUND',
    );
  });

  it('Should revoke authorization code', async () => {
    OAuthCodesModel.remove.mockImplementationOnce((_, cb) => cb());
    const successResult = await revokeAuthorizationCode('test');
    expect(successResult).toBe(true);

    OAuthCodesModel.remove.mockImplementationOnce((_, cb) =>
      cb(new Error('something went wrong')),
    );
    const failureResult = await revokeAuthorizationCode('test');
    expect(failureResult).toBe(false);
  });
});

describe('OAuthClientsModel tests', () => {
  const OAuthClientsModel = mongoose.model('OauthClients');
  const UserModel = mongoose.model('Users');

  const mockClient = {
    id: 'test-client-id',
    secret: '$2b$08$jbvmkot8uaYypvFjakan7OgnGq.H3ub3Ww0LXnuYXB4MUbvwSz/7m',
    name: 'test client',
    userId: 'test-user-id',
  };

  it('Should create client', async () => {
    OAuthClientsModel.prototype.save.mockImplementation(async () => mockClient);
    const result = await createClient(mockClient);
    expect(result).toBe(mockClient);
  });

  it('Should get client by only id', async () => {
    OAuthClientsModel.findOne.mockImplementation(
      injectLean(async () => mockClient),
    );
    const result = await getClient(mockClient.id);
    expect(result).toStrictEqual(mockClient);
  });

  it('Should get client by id and secret with secret is valid', async () => {
    OAuthClientsModel.findOne.mockImplementation(
      injectLean(async () => mockClient),
    );
    const result = await getClient(mockClient.id, 'bar');
    expect(result).toStrictEqual(mockClient);
  });

  it('Should should not return client if secret does not match', async () => {
    OAuthClientsModel.findOne.mockImplementation(
      injectLean(async () => mockClient),
    );
    const result = await getClient(mockClient.id, '123');
    expect(result).toBe(null);
  });

  it('Should swallow error if search fails', async () => {
    OAuthClientsModel.findOne.mockImplementation(
      injectLean(() => Promise.reject(new Error())),
    );
    const result = await getClient(mockClient.id);
    expect(result).toBe(null);
  });

  it('Should get user from client', async () => {
    OAuthClientsModel.findOne.mockImplementation(
      injectLean(async () => mockClient),
    );
    UserModel.findById.mockImplementation(injectLean(async () => MOCK_USER));
    const result = await getUserFromClient(mockClient);
    expect(result).toBe(MOCK_USER);
  });

  it('Should gracefully handle userless clients', async () => {
    OAuthClientsModel.findOne.mockImplementation(injectLean(async () => ({})));
    const result = await getUserFromClient(mockClient);
    expect(result).toBe(null);
  });

  it('Should gracefully handle find errors', async () => {
    OAuthClientsModel.findOne.mockImplementation(
      injectLean(() => Promise.reject(new Error())),
    );
    const result = await getUserFromClient(mockClient);
    expect(result).toBe(null);
  });

  it('Should get all clients for user', async () => {
    OAuthClientsModel.find.mockImplementation(
      injectLean(async () => [MOCK_USER, MOCK_USER]),
    );
    const result = await getAllClientsForUser(MOCK_USER.id);
    expect(result).toStrictEqual([MOCK_USER, MOCK_USER]);
  });

  it('Should gracefully handle errors', async () => {
    OAuthClientsModel.find.mockImplementation(
      injectLean(() => Promise.reject(new Error())),
    );
    const result = await getAllClientsForUser(MOCK_USER.id);
    expect(result).toStrictEqual([]);
  });

  it('Should delete client', async () => {
    OAuthClientsModel.findOneAndRemove.mockImplementation(
      injectLean(async () => {}),
    );
    const result = await deleteClient(mockClient);
    expect(result).toBe(undefined);
  });
});

describe('OAuthTokensModel tests', () => {
  const OAuthTokensModel = mongoose.model('OauthTokens');
  const OAuthClientsModel = mongoose.model('OauthClients');
  const UserModel = mongoose.model('Users');
  const mockClient = {
    id: 'test-client-id',
  };

  const mockToken = {
    accessToken: 'test-access-token',
    accessTokenExpiresAt: new Date(),
    refreshToken: 'test-refresh-token',
    refreshTokenExpiresAt: new Date(),
    client: mockClient.id,
    user: MOCK_USER.email,
  };

  it('Should save token', async () => {
    const result = await saveToken(mockToken, mockClient, MOCK_USER);
    expect(result).toEqual({
      ...mockToken,
      client: mockClient,
      user: MOCK_USER,
      toJSON: undefined,
    });
  });

  it('Should get access token', async () => {
    OAuthTokensModel.findOne.mockReturnValueOnce(
      Promise.resolve(new OAuthTokensModel(mockToken)),
    );
    OAuthClientsModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(mockClient)),
    );
    UserModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(MOCK_USER)),
    );

    const result = await getAccessToken('test-access-token');
    expect(result).toEqual({
      ...mockToken,
      client: mockClient,
      user: MOCK_USER,
      toJSON: undefined,
    });
  });

  it('Should fail get access token for invalid tokens', async () => {
    const mockTokens = [
      null,
      {
        client: null,
        user: MOCK_USER.email,
      },
      {
        client: mockClient.id,
        user: null,
      },
    ];

    for (const token of mockTokens) {
      OAuthTokensModel.findOne.mockReturnValueOnce(
        Promise.resolve(new OAuthTokensModel(token)),
      );

      const result = await getAccessToken('test-access-token');
      expect(result).toBe(null);
    }
  });

  it('Should fail get access token for unkown client', async () => {
    OAuthTokensModel.findOne.mockReturnValueOnce(
      Promise.resolve(new OAuthTokensModel(mockToken)),
    );
    OAuthClientsModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(null)),
    );
    UserModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(MOCK_USER)),
    );
    const result = await getAccessToken('test-access-token');
    expect(result).toBe(null);
  });

  it('Should fail get access token for unkown user', async () => {
    OAuthTokensModel.findOne.mockReturnValueOnce(
      Promise.resolve(new OAuthTokensModel(mockToken)),
    );
    OAuthClientsModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(mockClient)),
    );
    UserModel.findOne.mockReturnValueOnce(injectLean(Promise.resolve(null)));
    const result = await getAccessToken('test-access-token');
    expect(result).toBe(null);
  });

  it('Should fail get access token if find token fails', async () => {
    OAuthTokensModel.findOne.mockReturnValueOnce(
      Promise.reject(new Error('db unavailable')),
    );
    const result = await getAccessToken('test-access-token');
    expect(result).toBe(null);
  });

  it('Should revoke token', async () => {
    OAuthTokensModel.remove.mockImplementation((_, cb) => setTimeout(cb, 0));
    const result = await revokeToken(mockToken);
    expect(result).toBe(true);
  });

  it('Should handle revoke token error', async () => {
    OAuthTokensModel.remove.mockImplementation((_, cb) =>
      setTimeout(() => cb(new Error('db unavailable')), 0),
    );
    const result = await revokeToken(mockToken);
    expect(result).toBe(false);
  });

  it('Should get refresh token', async () => {
    OAuthTokensModel.findOne.mockReturnValueOnce(
      Promise.resolve(new OAuthTokensModel(mockToken)),
    );
    OAuthClientsModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(mockClient)),
    );
    UserModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(MOCK_USER)),
    );

    const result = await getRefreshToken('test-refresh-token');
    expect(result).toEqual({
      ...mockToken,
      client: mockClient,
      user: MOCK_USER,
      toJSON: undefined,
    });
  });

  it('Should fail get refresh token for invalid tokens', async () => {
    const mockTokens = [
      null,
      {
        client: null,
        user: MOCK_USER.email,
      },
      {
        client: mockClient.id,
        user: null,
      },
    ];

    for (const token of mockTokens) {
      OAuthTokensModel.findOne.mockReturnValueOnce(
        Promise.resolve(new OAuthTokensModel(token)),
      );

      const result = await getRefreshToken('test-access-token');
      expect(result).toBe(null);
    }
  });

  it('Should fail get refresh token for unkown client', async () => {
    OAuthTokensModel.findOne.mockReturnValueOnce(
      Promise.resolve(new OAuthTokensModel(mockToken)),
    );
    OAuthClientsModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(null)),
    );
    UserModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(MOCK_USER)),
    );
    const result = await getRefreshToken('test-access-token');
    expect(result).toBe(null);
  });

  it('Should fail get refresh token for unkown user', async () => {
    OAuthTokensModel.findOne.mockReturnValueOnce(
      Promise.resolve(new OAuthTokensModel(mockToken)),
    );
    OAuthClientsModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(mockClient)),
    );
    UserModel.findOne.mockReturnValueOnce(injectLean(Promise.resolve(null)));
    const result = await getRefreshToken('test-access-token');
    expect(result).toBe(null);
  });

  it('Should fail get refresh token if find token fails', async () => {
    OAuthTokensModel.findOne.mockReturnValueOnce(
      Promise.reject(new Error('db fooo')),
    );
    const result = await getRefreshToken('test-access-token');
    expect(result).toBe(null);
  });
});
