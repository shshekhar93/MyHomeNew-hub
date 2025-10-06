import passport from 'passport';
import UserModel from '../../models/users';
import { generateExpressRequestMocks } from '../../test/test-utils';
import { authMiddleware, authorize } from '../passport';
import _omit from 'lodash/omit';

const TEST_USER = 'foo';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'bar';
const TEST_PASSWORD_HASH
  = '$2b$08$jbvmkot8uaYypvFjakan7OgnGq.H3ub3Ww0LXnuYXB4MUbvwSz/7m';
const INVALID_HASH
  = '$2b$08$RjT7sW0WqrF.sSZ3pWrKk.HkWI.5WQ/jsYLu2KNVXEVVIracej4OG';

const setupAuthRequest = (req) => {
  req.body.username = TEST_USER;
  req.body.password = TEST_PASSWORD;
};

describe('Passport -- Authentication tests', () => {
  const orig = UserModel.findOne;

  beforeAll(() => {
    UserModel.findOne = jest.fn();
  });

  afterAll(() => {
    UserModel.findOne = orig;
  });

  it('Should attempt to load user & return unauth resp if not found', (done) => {
    UserModel.findOne.mockImplementation(async () => null);

    const [req, res, next] = generateExpressRequestMocks();
    setupAuthRequest(req);

    res.json.mockImplementation((body) => {
      try {
        expect(UserModel.findOne).toHaveBeenCalledTimes(2);
        expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'foo' });
        expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'foo' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(body).toStrictEqual({
          success: false,
          err: 'Invalid credentials.',
        });
        done();
      }
      catch (err) {
        done(err);
      }
    });

    authMiddleware(req, res, next);
  });

  it('Should not attempt to load user by username if found by email', (done) => {
    const mockUser = {
      _id: 'test',
      email: TEST_USER_EMAIL,
      name: 'Test User',
      hubClientId: 'test',
      password: TEST_PASSWORD_HASH,
      toJSON: function () {
        return this;
      },
    };

    UserModel.findOne.mockImplementation(async () => mockUser);

    const [req, res, next] = generateExpressRequestMocks();
    setupAuthRequest(req);

    // Login success case
    req.login.mockImplementation((_, cb) => setTimeout(cb, 0));

    next.mockImplementation((err) => {
      try {
        expect(UserModel.findOne).toHaveBeenCalledTimes(1);
        expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'foo' });
        expect(req.login).toHaveBeenCalledWith(
          _omit(mockUser, ['password', 'toJSON']),
          expect.any(Function),
        );
        expect(res.status).not.toHaveBeenCalled();
        done(err);
      }
      catch (err) {
        done(err);
      }
    });

    authMiddleware(req, res, next);
  });

  it('Should not attempt to load user by username if found by email and login failed', (done) => {
    const mockUser = {
      _id: 'test',
      email: 'test@example.com',
      name: 'Test User',
      hubClientId: 'test',
      password: TEST_PASSWORD_HASH,
      toJSON: function () {
        return this;
      },
    };

    UserModel.findOne.mockImplementation(async () => mockUser);

    const [req, res, next] = generateExpressRequestMocks();
    setupAuthRequest(req);

    // Login success case
    req.login.mockImplementation((_, cb) => setTimeout(cb, 0));

    // Login error case
    const error = new Error('login failed');
    req.login.mockImplementation((_, cb) => setTimeout(() => cb(error), 0));
    next.mockImplementation((err) => {
      try {
        expect(err).toBe(error);
        expect(res.status).not.toHaveBeenCalled();
        done();
      }
      catch (err) {
        done(err);
      }
    });

    authMiddleware(req, res, next);
  });

  it('Should fail if user password does not match', (done) => {
    UserModel.findOne.mockImplementation(async () => ({
      password: INVALID_HASH,
    }));

    const [req, res, next] = generateExpressRequestMocks();
    setupAuthRequest(req);

    res.json.mockImplementation((body) => {
      try {
        expect(UserModel.findOne).toHaveBeenCalledTimes(1);
        expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'foo' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(body).toStrictEqual({
          success: false,
          err: 'Invalid credentials.',
        });
        done();
      }
      catch (err) {
        done(err);
      }
    });
    authMiddleware(req, res, next);
  });

  it('Should fail if find user fails', (done) => {
    const dbError = new Error('Database unavailable');
    UserModel.findOne.mockImplementation(() => Promise.reject(dbError));

    const [req, res, next] = generateExpressRequestMocks();
    setupAuthRequest(req);

    next.mockImplementation((err) => {
      try {
        expect(UserModel.findOne).toHaveBeenCalledTimes(1);
        expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'foo' });
        expect(err).toBe(dbError);
        done();
      }
      catch (err) {
        done(err);
      }
    });

    authMiddleware(req, res, next);
  });
});

describe('Passport -- Authorization tests', () => {
  let req;
  let res;
  let next;
  beforeAll(() => {
    [req, res, next] = generateExpressRequestMocks();
    req.isAuthenticated = jest.fn();
  });

  it('Should fail authorization if not req.isAuthenticated', (done) => {
    req.isAuthenticated.mockReturnValueOnce(false);

    res.json.mockImplementation((body) => {
      try {
        expect(res.status).toHaveBeenLastCalledWith(401);
        expect(body).toStrictEqual({
          success: false,
          err: 'UNAUTHORIZED',
        });
        done();
      }
      catch (err) {
        done(err);
      }
    });
    authorize(req, res, next);
  });

  it('Should fail authorization if not req.user', (done) => {
    req.isAuthenticated.mockReturnValueOnce(true);
    req.user = null;

    res.json.mockImplementation((body) => {
      try {
        expect(res.status).toHaveBeenLastCalledWith(401);
        expect(body).toStrictEqual({
          success: false,
          err: 'UNAUTHORIZED',
        });
        done();
      }
      catch (err) {
        done(err);
      }
    });
    authorize(req, res, next);
  });

  it('Should pass authorization if req authenticated and user', (done) => {
    req.isAuthenticated.mockReturnValueOnce(true);
    req.user = {};

    next.mockImplementation((err) => {
      expect(err).toBe(undefined);
      done();
    });
    authorize(req, res, next);
  });
});

describe('Passport -- serialize / deserialize tests', () => {
  const orig = UserModel.findOne;

  beforeAll(() => {
    UserModel.findOne = jest.fn();
  });

  afterAll(() => {
    UserModel.findOne = orig;
  });

  it('Should serialize user', (done) => {
    passport.serializeUser(
      {
        email: TEST_USER_EMAIL,
      },
      (err, serializedUser) => {
        try {
          expect(err).toBe(null);
          expect(serializedUser).toBe(TEST_USER_EMAIL);
          done();
        }
        catch (err) {
          done(err);
        }
      },
    );
  });

  it('Should deserialize user', (done) => {
    UserModel.findOne.mockImplementation(async () => ({
      name: 'test',
      password: TEST_PASSWORD_HASH,
      toJSON: function () {
        return this;
      },
    }));
    passport.deserializeUser(TEST_USER_EMAIL, (err, user) => {
      try {
        expect(err).toBe(null);
        expect(user).toStrictEqual({ name: 'test' });
        done();
      }
      catch (err) {
        done(err);
      }
    });
  });

  it('Should handle find failure in desrialization', (done) => {
    const dbError = new Error('Database unavailable');
    UserModel.findOne.mockImplementation(() => Promise.reject(dbError));
    passport.deserializeUser(TEST_USER_EMAIL, (err, user) => {
      try {
        expect(err).toBe(dbError);
        expect(user).toBe(undefined);
        done();
      }
      catch (err) {
        done(err);
      }
    });
  });
});
