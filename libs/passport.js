'use strict';

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import _pick from 'lodash/pick.js';
import bcrypt from 'bcrypt';
import { promisify } from 'util';
import UserModel from '../models/users.js';

const compare = promisify(bcrypt.compare.bind(bcrypt));
const USER_FIELDS = ['_id', 'email', 'name', 'hubClientId'];

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      let user = await UserModel.findOne({ email: username });
      if (!user) {
        user = await UserModel.findOne({ username });
      }

      if (!user) {
        return done(null, false);
      }

      const res = await compare(password, user.password);
      done(null, res ? _pick(user.toJSON(), USER_FIELDS) : false);
    } catch (err) {
      done(err);
    }
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.email);
});

passport.deserializeUser(async function (email, done) {
  try {
    const user = await UserModel.findOne({ email });
    done(null, _pick(user.toJSON(), USER_FIELDS));
  } catch (err) {
    done(err);
  }
});

const authMiddleware = (req, res, next) => {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        err: 'Invalid credentials.',
      });
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      next();
    });
  })(req, res, next);
};

const authorize = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      err: 'UNAUTHORIZED',
    });
  }
  next();
};

export { authMiddleware, authorize };
