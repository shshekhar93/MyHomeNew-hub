import _omit from 'lodash/omit';
import { generateExpressRequestMocks } from '../../test/test-utils.js';
import {
  getAllClientsForUser,
  getClient,
  createClient,
  getUserFromClient,
  deleteClient,
} from '../../models/oAuth.js';
import {
  createNewClient,
  deleteClientCreds,
  getAuthMiddleware,
  getExistingClientsForUser,
  getPublicClientDetails,
} from '../oAuth';

jest.mock('../../models/oAuth.js', () => ({
  getAllClientsForUser: jest.fn(),
  getClient: jest.fn(),
  createClient: jest.fn(),
  getUserFromClient: jest.fn(),
  deleteClient: jest.fn(),
}));

const MOCK_CLIENT_ONE = {
  _id: 'client-id-hash-one',
  id: 'test-client-one',
  secret: '$2b$08$jbvmkot8uaYypvFjakan7OgnGq.H3ub3Ww0LXnuYXB4MUbvwSz/7m',
  grants: ['authorization_code'],
  createdDate: '2023-03-01T00:00:00.000Z',
  __v: 0,
};

const MOCK_CLIENT_TWO = {
  _id: 'client-id-hash-two',
  id: 'test-client-two',
};

const MOCK_USER = {
  _id: 'test-user-id',
};

describe('oAuth Controller Tests -- getExistingClientsForUser', () => {
  let req;
  let res;
  beforeEach(() => {
    [req, res] = generateExpressRequestMocks();
    req.user = {};
  });

  it('Should return all clients for user', async () => {
    getAllClientsForUser.mockReturnValueOnce(
      Promise.resolve([MOCK_CLIENT_ONE, MOCK_CLIENT_TWO]),
    );
    req.user._id = 'test-user-id';
    await getExistingClientsForUser(req, res);
    expect(res.json).toHaveBeenCalledWith([
      _omit(MOCK_CLIENT_ONE, ['_id', '__v', 'secret']),
      {
        ..._omit(MOCK_CLIENT_TWO, ['_id', '__v', 'secret']),
        createdDate: '1970-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('Should return empty clients if error', async () => {
    getAllClientsForUser.mockReturnValueOnce(
      Promise.reject(new Error('DB unavailble')),
    );
    req.user._id = 'test-user-id';
    await getExistingClientsForUser(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('Should return empty clients if user not logged-in', async () => {
    await getExistingClientsForUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe('oAuth Controller Tests -- deleteClientCreds', () => {
  let req;
  let res;
  beforeEach(() => {
    [req, res] = generateExpressRequestMocks();
    req.user = {};
  });

  it('Should delete client creds', async () => {
    getUserFromClient.mockResolvedValueOnce(MOCK_USER);
    deleteClient.mockResolvedValueOnce(null);
    req.user = MOCK_USER;
    req.body = { id: MOCK_CLIENT_ONE.id };
    await deleteClientCreds(req, res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('Should fail if no client id to delete', async () => {
    await deleteClientCreds(req, res);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'No client to delete',
    });
  });

  it('Should fail if no client id to delete - null', async () => {
    getUserFromClient.mockResolvedValueOnce(null);
    req.body = { id: MOCK_CLIENT_ONE.id };
    await deleteClientCreds(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'Client not found',
    });
  });

  it('Should fail if user not authorized', async () => {
    getUserFromClient.mockResolvedValueOnce(MOCK_USER);
    req.user = {};
    req.body = { id: MOCK_CLIENT_ONE.id };
    await deleteClientCreds(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'No permission to perform this action',
    });
  });
});

describe('oAuth Controller Tests -- createNewClient', () => {
  let req;
  let res;
  beforeEach(() => {
    [req, res] = generateExpressRequestMocks();
    req.user = {};
  });

  it('Should create new client', async () => {
    createClient.mockResolvedValueOnce(null);
    req.user = MOCK_USER;
    req.body = {
      name: 'test client',
      redirectUri: 'https://example.com',
    };

    await createNewClient(req, res);

    const clientMatcher = {
      name: 'test client',
      grants: ['client_credentials'],
      redirectUris: ['https://example.com'],
      userId: MOCK_USER._id,
      id: expect.stringMatching(/[a-z0-9]{32}/),
      secret: expect.stringMatching(/[a-z0-9]{32}/),
    };
    expect(createClient).toHaveBeenCalledWith({
      ...clientMatcher,
      secret: expect.stringMatching(/\$2b\$08\$[A-Za-z0-9./]{53}/),
    });
    expect(res.json).toHaveBeenCalledWith(clientMatcher);
  });

  it('Should not create new client with incomplete input', async () => {
    req.body = {
      redirectUri: 'https://example.com',
    };

    await createNewClient(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid input',
    });

    res.json.mockClear();
    res.status.mockClear();
    req.body = {
      name: 'test client',
    };

    await createNewClient(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid input',
    });
  });
});

describe('oAuth Controller Tests -- getPublicClientDetails', () => {
  let req;
  let res;
  beforeEach(() => {
    [req, res] = generateExpressRequestMocks();
    req.user = {};
  });

  it('Should return client details', async () => {
    getClient.mockResolvedValueOnce(MOCK_CLIENT_ONE);
    req.params = { id: MOCK_CLIENT_ONE.id };
    await getPublicClientDetails(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      client: _omit(MOCK_CLIENT_ONE, ['_id', '__v', 'secret']),
    });
  });

  it('Should fail if client not found', async () => {
    getClient.mockResolvedValueOnce(null);
    req.params = { id: MOCK_CLIENT_ONE.id };
    await getPublicClientDetails(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      client: null,
    });
  });

  it('Should fail if client does not support auth code grant', async () => {
    getClient.mockResolvedValueOnce({
      ...MOCK_CLIENT_ONE,
      grants: [],
    });
    req.params = { id: MOCK_CLIENT_ONE.id };
    await getPublicClientDetails(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      client: null,
    });
  });
});

describe('oAuth Controller Tests -- getAuthMiddleware', () => {
  it('Should return logged in user', () => {
    const handler = getAuthMiddleware({
      authorize: input => input,
    });
    expect(handler.authenticateHandler.handle({ user: MOCK_USER })).toBe(
      MOCK_USER,
    );
  });
});
