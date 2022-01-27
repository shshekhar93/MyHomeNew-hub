'use strict';

import bcrypt from 'bcrypt';
import uuid from 'uuid/v4.js';
import { promisify } from 'util';
import { authorize } from '../libs/passport.js';
import { logError } from '../libs/logger.js';
import UserModel from '../models/users.js';

const hash = promisify(bcrypt.hash);

const setupUserRoutes = app => {
  app.get('/user/@me', authorize, (req, res) => {
    res.json(req.user);
  });

  app.post('/user/@me', authorize, (req, res) => {
    res.status(400).json({});
  });

  app.get('/user/check-user-name', (req, res) => {
    UserModel.findOne({username: req.query.username})
      .then(user => !!user)
      .catch(() => false)
      .then((exists) => {
        res.json({ exists });
      });
  });

  app.post('/user/register', (req, res) => {
    if(!req.body.email || !req.body.name || !req.body.password || !req.body.username) {
      return res.status(400).json({
        error: 'missing required field'
      });
    }

    const hubClientId = uuid().replace(/-/g, '');
    const clientSecret = uuid().replace(/-/g, '');
    Promise.all([hash(req.body.password, 8), hash(clientSecret, 8)])
      .then(([password, hubClientSecret]) => {
        const user = new UserModel({
          ...req.body,
          password,
          hubClientId,
          hubClientSecret
        });
        return user.save();
      })
      .then(() => {
        res.json({
          hubClientId, 
          hubClientSecret: clientSecret
        });
      })
      .catch(err => {
        logError(err);
        return res.status(500).json({error: 'Internal server error'});
      });
  });
};

export default setupUserRoutes;
