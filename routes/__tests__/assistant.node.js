import { execute, queryStatus, syncDevices } from '../../controllers/assistant';
import { isDevOnline, proxy } from '../../controllers/ws/server';
import { revokeToken } from '../../models/oAuth';
import { generateExpressRequestMocks } from '../../test/test-utils';
import setupAssistantRoutes from '../assistant';

jest.mock('../../controllers/ws/server.js', () => ({
  isDevOnline: jest.fn(),
  proxy: jest.fn(),
}));

jest.mock('../../controllers/assistant.js', () => ({
  syncDevices: jest.fn(),
  queryStatus: jest.fn(),
  execute: jest.fn(),
}));

jest.mock('../../models/oAuth.js', () => ({
  revokeToken: jest.fn(),
}));

describe('Assistant route tests', () => {
  let path;
  let oAuthAuthenticate;
  let handler;
  const mockApp = { post: jest.fn() };

  beforeAll(() => {
    setupAssistantRoutes(mockApp);
    [path, oAuthAuthenticate, handler] = mockApp.post.mock.calls[0];
  });

  it('Should setup assistant routes', () => {
    expect(path).toBe('/assistant/fullfill');
  });

  it('oAuth authenticator should skip for authenticated requests', (done) => {
    const [req, res, next] = generateExpressRequestMocks();
    req.isAuthenticated = jest.fn(() => true);
    next.mockImplementation((err) => {
      try {
        expect(err).toBe(undefined);
        done();
      }
      catch (err) {
        done(err);
      }
    });
    oAuthAuthenticate(req, res, next);
  });

  it('oAuth authenticator should be called for unauthenticated requests', (done) => {
    const [req, res, next] = generateExpressRequestMocks();
    const authMiddleware = jest.fn((_req, _res, next) => setTimeout(next, 0));
    req.app = { oAuth: { authenticate: () => authMiddleware } };
    req.isAuthenticated = jest.fn(() => false);

    next.mockImplementation((err) => {
      try {
        expect(err).toBe(undefined);
        expect(authMiddleware).toHaveBeenCalledWith(req, res, next);
        done();
      }
      catch (err) {
        done(err);
      }
    });
    oAuthAuthenticate(req, res, next);
  });

  it('Should proxy request if hub is online', () => {
    const [req, res] = generateExpressRequestMocks();
    req.user = { hubClientId: 'test' };
    isDevOnline.mockReturnValueOnce(true);

    handler(req, res);
    expect(proxy).toHaveBeenCalledWith(req, res);
  });

  it('Should handle various intents', () => {
    const [req, res] = generateExpressRequestMocks();
    const intetHandlerMapping = {
      'action.devices.SYNC': [syncDevices, req, res],
      'action.devices.QUERY': [queryStatus, req, res],
      'action.devices.EXECUTE': [execute, req, res],
      UNKNOWN: [res.status, 400],
    };
    Object.entries(intetHandlerMapping).forEach(
      ([intent, [intentHandler, ...args]]) => {
        req.body.inputs = [{ intent }];
        handler(req, res);
        expect(intentHandler).toHaveBeenCalledWith(...args);
      },
    );
  });

  it('Should handle disconnect action', (done) => {
    const [req, res] = generateExpressRequestMocks();
    req.body.inputs = [{ intent: 'action.devices.DISCONNECT' }];
    revokeToken.mockReturnValueOnce(Promise.resolve());

    res.json.mockImplementation((result) => {
      try {
        expect(result).toEqual({});
        expect(res.status).not.toHaveBeenCalled();
        done();
      }
      catch (err) {
        done(err);
      }
    });

    handler(req, res);
  });

  it('Should ignore disconnect errors', (done) => {
    const [req, res] = generateExpressRequestMocks();
    req.body.inputs = [{ intent: 'action.devices.DISCONNECT' }];
    revokeToken.mockReturnValueOnce(Promise.reject(new Error('test')));

    res.json.mockImplementation((result) => {
      try {
        expect(result).toEqual({});
        expect(res.status).not.toHaveBeenCalled();
        done();
      }
      catch (err) {
        done(err);
      }
    });

    handler(req, res);
  });
});
