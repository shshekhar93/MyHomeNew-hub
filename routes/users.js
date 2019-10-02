'use strict';

const { authorize } = require('../libs/passport');
const { promisify } = require('util');
const hash = promisify(require('bcrypt').hash);
const uuid = require('uuid/v4');
const UserModel = require('../models/users');

module.exports = app => {
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
        console.log(err.stack);
        return res.status(500).json({error: 'Internal server error'});
      });
  });
};
