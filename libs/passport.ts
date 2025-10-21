'use strict';

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import _pick from 'lodash/pick.js';
import bcrypt from 'bcrypt';
import { promisify } from 'util';
import UserModel from '../models/users.js';
import type { NextFunction, Request, Response } from 'express';

const compare = promisify(bcrypt.compare.bind(bcrypt));

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
      done(null, res
        ? {
            _id: user._id,
            email: user.email,
            name: user.name,
            hubClientId: user.hubClientId,
          }
        : false);
    }
    catch (err) {
      done(err);
    }
  }),
);

passport.serializeUser(function (user, done) {
  done(null, user.email);
});

passport.deserializeUser(async function (email, done) {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return done(new Error('User not found'));
    }

    done(null, {
      _id: user._id,
      email: user.email,
      name: user.name,
      hubClientId: user.hubClientId,
    });
  }
  catch (err) {
    done(err);
  }
});

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', function (err: Error, user: Request['user'], _: unknown) {
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

const authorize = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      err: 'UNAUTHORIZED',
    });
  }
  next();
};

export { authMiddleware, authorize };
