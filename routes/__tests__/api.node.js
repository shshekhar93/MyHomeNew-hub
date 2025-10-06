import { jest } from '@jest/globals';
import { isDevOnline, proxy } from '../../controllers/ws/server';
import { generateExpressRequestMocks } from '../../test/test-utils';
import setupAPIRoutes from '../api';

jest.mock('../../controllers/ws/server.js', () => ({
  isDevOnline: jest.fn(),
  proxy: jest.fn(),
}));

describe('Api routes -- all tests', () => {
  const mockApp = {
    get: jest.fn(),
    post: jest.fn(),
    oAuth: {
      authenticate: jest.fn(),
    },
  };

  const anyFn = expect.any(Function);

  it('Should setup api routes', () => {
    setupAPIRoutes(mockApp);
    expect(mockApp.get).toHaveBeenCalledWith(
      '/v1/devices',
      anyFn,
      anyFn,
      anyFn,
    );
    expect(mockApp.get).toHaveBeenCalledWith(
      '/v1/devices/:name',
      anyFn,
      anyFn,
      anyFn,
    );
    expect(mockApp.post).toHaveBeenCalledWith(
      '/v1/devices/:name/set-state',
      anyFn,
      anyFn,
      anyFn,
    );
    expect(mockApp.get).toHaveBeenCalledWith('/v1/app/latest-manifest', anyFn);
    expect(mockApp.get).toHaveBeenCalledWith('/v1/app/download/:apk', anyFn);
  });

  it('Should test the oAuth middleware when req.user present', (done) => {
    setupAPIRoutes(mockApp);

    const oAuth = mockApp.get.mock.calls[0][1];
    const [req, res, next] = generateExpressRequestMocks();
    req.user = {};
    next.mockImplementation(() => {
      try {
        expect(res?.locals?.oauth?.token?.user).toBe(req.user);
        done();
      }
      catch (err) {
        done(err);
      }
    });

    oAuth(req, res, next);
  });

  it('Should test the oAuth middleware when req.user absent', (done) => {
    const oAuthAuthenticator = jest.fn((_req, _res, next) => setTimeout(next, 0));
    mockApp.oAuth.authenticate.mockReturnValueOnce(oAuthAuthenticator);
    setupAPIRoutes(mockApp);

    const oAuth = mockApp.get.mock.calls[0][1];
    const [req, res, next] = generateExpressRequestMocks();
    next.mockImplementation(() => {
      try {
        expect(oAuthAuthenticator).toHaveBeenCalledWith(req, res, anyFn);
        done();
      }
      catch (err) {
        done(err);
      }
    });

    oAuth(req, res, next);
  });

  it('Should test applyReqUser middleware when not proxying', (done) => {
    setupAPIRoutes(mockApp);

    const applyReqUser = mockApp.get.mock.calls[0][2];
    const [req, res, next] = generateExpressRequestMocks();
    res.locals = { oauth: { token: { user: { name: 'test' } } } };
    next.mockImplementation(() => {
      try {
        expect(req.user).toBe(res.locals.oauth.token.user);
        expect(proxy).not.toHaveBeenCalled();
        done();
      }
      catch (err) {
        done(err);
      }
    });
    applyReqUser(req, res, next);
  });

  it('Should not proxy when user is null', (done) => {
    setupAPIRoutes(mockApp);

    const applyReqUser = mockApp.get.mock.calls[0][2];
    const [req, res, next] = generateExpressRequestMocks();
    res.locals = { oauth: { token: { user: null } } };
    next.mockImplementation(() => {
      try {
        expect(req.user).toBe(res.locals.oauth.token.user);
        expect(proxy).not.toHaveBeenCalled();
        done();
      }
      catch (err) {
        done(err);
      }
    });
    applyReqUser(req, res, next);
  });

  it('Should not proxy when device is not online', (done) => {
    setupAPIRoutes(mockApp);

    const applyReqUser = mockApp.get.mock.calls[0][2];
    const [req, res, next] = generateExpressRequestMocks();
    res.locals = { oauth: { token: { user: { hubClientId: 'foo' } } } };
    isDevOnline.mockImplementation(() => false);

    next.mockImplementation(() => {
      try {
        expect(req.user).toBe(res.locals.oauth.token.user);
        expect(proxy).not.toHaveBeenCalled();
        done();
      }
      catch (err) {
        done(err);
      }
    });
    applyReqUser(req, res, next);
  });

  it('Should proxy when device is online', (done) => {
    setupAPIRoutes(mockApp);

    const applyReqUser = mockApp.get.mock.calls[0][2];
    const [req, res, next] = generateExpressRequestMocks();
    res.locals = { oauth: { token: { user: { hubClientId: 'foo' } } } };
    isDevOnline.mockImplementation(() => true);

    proxy.mockImplementation(() => {
      try {
        expect(isDevOnline).toHaveBeenCalledWith(
          res.locals.oauth.token.user.hubClientId,
        );
        expect(proxy).toHaveBeenCalledWith(req, res);
        done();
      }
      catch (err) {
        done(err);
      }
    });
    applyReqUser(req, res, next);
  });
});
