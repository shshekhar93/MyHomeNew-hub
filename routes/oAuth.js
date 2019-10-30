'use strict';
const uuid = require('uuid/v4');
const _get = require('lodash/get');
const { promisify } = require('util');
const hash = promisify(require('bcrypt').hash);
const { authorize } = require('../libs/passport');
const { createClient } = require('../models/oAuth');

module.exports = (app) => {
  app.get('/authorize', function(req, res) {
    if(!req.isAuthenticated() || !req.user) {
      return res.redirect(`/login?redirectTo=${encodeURIComponent(req.originalUrl)}`)
    }
    
    const prefix = `<!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Authorize</title>
          <link rel="stylesheet" href="https://unpkg.com/bootstrap@4.1.0/dist/css/bootstrap.min.css" crossorigin="anonymous" />
        </head>
        <body>
          <div class="container" style="padding-top: 50px; text-align: center">
            <form action="/authorize" method="POST">
              <input type="hidden" name="grant_type" value="code" />
              <h4>Authorize Google assistant to control your devices</h4>`;
    const postfix = `
              <button class="btn btn-primary" type="submit" style="margin-top: 30px;">Authorize</button>
            </form>
          </div>
        </body>
      </html>`;
    const inputs = Object.keys(req.query).reduce((html, key) => 
      html + `<input type="hidden" name="${key}" value="${req.query[key]}" />`, '');
    res.type('html').send(prefix + inputs + postfix);
  });

  app.post('/authorize', authorize, (req, res, next) => console.log('hrer') || next(), app.oAuth.authorize({
    authenticateHandler: {
      handle: (req, res) => {
        console.log(req.user);
        return req.user;
      }
    }
  }));

  app.post('/token', app.oAuth.token());

  app.post('/create-client', authorize, (req, res) => {
    const userId = _get(req, 'user._id');

    // Check if user already have existing client creds

    if(req.body.name && req.body.redirectUri) {
      const name = req.body.name;
      const id = uuid().replace(/-/g, '');
      const secret = uuid().replace(/-/g, '');
      const grants = [ 'authorization_code',  'refresh_token' ];
      const redirectUris = [ req.body.redirectUri ];
      return hash(secret, 8)
        .then(secret => createClient({name, id, secret, grants, redirectUris, userId}))
        .then(resp => res.json({ ...resp.toJSON(), secret, _id: undefined, __v: undefined }))
        .catch(err => res.status(500).json({err: err.message}));
    }
    return res.status(403).end();
  });
}
