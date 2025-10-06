import { generateExpressRequestMocks } from '../../test/test-utils';
import setupLoginRoutes from '../login';

describe('Login routes tests', () => {
  const handlers = {};
  const mockApp = {
    get: (path, ...args) => (handlers[`GET_${path}`] = args.pop()),
    post: (path, ...args) => (handlers[`POST_${path}`] = args.pop()),
  };

  beforeAll(() => {
    setupLoginRoutes(mockApp);
  });

  it('Should test login handler', () => {
    const [req, res] = generateExpressRequestMocks();
    req.user = { name: 'test' };
    const handler = handlers['POST_/login'];
    handler(req, res);
    expect(res.json).toHaveBeenCalledWith(req.user);
  });

  it('Should return success for logout if user not logged-in', () => {
    const [req, res] = generateExpressRequestMocks();
    req.isAuthenticated = jest.fn(() => false);
    req.logout = jest.fn();
    const handler = handlers['GET_/logout'];
    handler(req, res);
    expect(req.isAuthenticated).toHaveBeenCalled();
    expect(req.logout).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('Should logout user if they are logged-in', (done) => {
    const [req, res] = generateExpressRequestMocks();
    req.isAuthenticated = jest.fn(() => true);
    req.logout = jest.fn(cb => setTimeout(cb, 0));
    const handler = handlers['GET_/logout'];
    handler(req, res);

    res.json.mockImplementation((result) => {
      try {
        expect(req.logout).toHaveBeenCalled();
        expect(result).toStrictEqual({ success: true });
        done();
      }
      catch (err) {
        done(err);
      }
    });
  });

  it('Should handle logout error, if any', (done) => {
    const [req, res] = generateExpressRequestMocks();
    req.isAuthenticated = jest.fn(() => true);
    req.logout = jest.fn(cb =>
      setTimeout(() => cb(new Error('logout failed')), 0),
    );
    const handler = handlers['GET_/logout'];
    handler(req, res);

    res.json.mockImplementation((result) => {
      try {
        expect(req.logout).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(result).toStrictEqual({ success: false });
        done();
      }
      catch (err) {
        done(err);
      }
    });
  });
});
