'use strict';

import bcrypt from 'bcrypt';
import uuid from 'uuid/v4.js';
import { promisify } from 'util';
import { authorize } from '../libs/passport.js';
import { logError } from '../libs/logger.js';
import UserModel from '../models/users.js';

const hash = promisify(bcrypt.hash);

const setupUserRoutes = (app) => {
  app.get('/user/@me', authorize, (req, res) => {
    res.json(req.user);
  });

  app.post('/user/@me', authorize, (req, res) => {
    res.status(405).json({
      success: false,
      err: 'Method not implemented',
    });
  });

  app.get('/user/check-user-name', async (req, res) => {
    try {
      const user = await UserModel.findOne({ username: req.query.username });
      res.json({
        success: true,
        exists: !!user,
      });
    } catch (err) {
      logError(err);
      res.status(500).json({});
    }
  });

  app.post('/user/register', async (req, res) => {
    if (
      !req.body.email ||
      !req.body.name ||
      !req.body.password ||
      !req.body.username
    ) {
      return res.status(400).json({
        success: false,
        error: 'missing required field',
      });
    }

    const hubClientId = uuid().replace(/-/g, '');
    const clientSecret = uuid().replace(/-/g, '');

    try {
      const password = await hash(req.body.password, 8);
      const hubClientSecret = await hash(clientSecret, 8);
      const userDoc = new UserModel({
        ...req.body,
        password,
        hubClientId,
        hubClientSecret,
      });
      await userDoc.save();

      res.json({
        success: true,
        hubClientId,
        hubClientSecret: clientSecret,
      });
    } catch (err) {
      logError(err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });
};

export default setupUserRoutes;
