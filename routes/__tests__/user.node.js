import UserModel from '../../models/users';
import { generateExpressRequestMocks } from '../../test/test-utils';
import setupUserRoutes from '../users';

describe('User route tests', () => {
  const handlers = {};
  const mockApp = {
    get: (path, ...args) => (handlers[`GET_${path}`] = args.pop()),
    post: (path, ...args) => (handlers[`POST_${path}`] = args.pop()),
  };
  const origFindOne = UserModel.findOne;
  const origSave = UserModel.prototype.save;

  beforeAll(() => {
    setupUserRoutes(mockApp);
    UserModel.findOne = jest.fn();
    UserModel.prototype.save = jest.fn();
  });

  afterAll(() => {
    UserModel.findOne = origFindOne;
    UserModel.prototype.save = origSave;
  });

  it('Should return current user', () => {
    const [req, res] = generateExpressRequestMocks();
    req.user = { name: 'test' };

    const handler = handlers['GET_/user/@me'];
    handler(req, res);
    expect(res.json).toHaveBeenCalledWith(req.user);
  });

  it('Should updte current user', () => {
    const [req, res] = generateExpressRequestMocks();
    req.user = { name: 'test' };

    const handler = handlers['POST_/user/@me'];
    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'Method not implemented',
    });
  });

  it('Should return if username is taken', async () => {
    const [req, res] = generateExpressRequestMocks();
    req.query.username = 'test';

    UserModel.findOne.mockReturnValueOnce(Promise.resolve({}));
    const handler = handlers['GET_/user/check-user-name'];
    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      exists: true,
    });

    UserModel.findOne.mockReturnValueOnce(Promise.resolve(null));
    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      exists: false,
    });
  });

  it('Should propagate check username errors', async () => {
    const [req, res] = generateExpressRequestMocks();
    req.query.username = 'test';

    UserModel.findOne.mockReturnValueOnce(Promise.reject(new Error('test')));
    const handler = handlers['GET_/user/check-user-name'];
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('Should validate mandatory fields for signup', () => {
    const reqBody = {
      name: 'test',
      email: 'test@example.com',
      username: 'foo',
      password: 'bar',
    };

    const mandatoryFields = ['name', 'email', 'username', 'password'];

    const [req, res] = generateExpressRequestMocks();
    const handler = handlers['POST_/user/register'];
    mandatoryFields.forEach((field) => {
      const orig = reqBody[field];
      reqBody[field] = null;
      req.body = reqBody;
      handler(req, res);
      reqBody[field] = orig;
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'missing required field',
      });
    });
  });

  it('Should register user', async () => {
    const [req, res] = generateExpressRequestMocks();
    req.body = {
      name: 'test',
      email: 'test@example.com',
      username: 'foo',
      password: 'bar',
    };

    UserModel.prototype.save.mockReturnValueOnce(Promise.resolve());

    const handler = handlers['POST_/user/register'];
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      hubClientId: expect.any(String),
      hubClientSecret: expect.any(String),
    });
  });

  it('Should handle registration error', async () => {
    const [req, res] = generateExpressRequestMocks();
    req.body = {
      name: 'test',
      email: 'test@example.com',
      username: 'foo',
      password: 'bar',
    };

    UserModel.prototype.save.mockImplementation(() =>
      Promise.reject(new Error('DB unavailable'))
    );

    const handler = handlers['POST_/user/register'];
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    });
  });
});
