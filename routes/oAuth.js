'use strict';
const { authorize } = require('../libs/passport');

module.exports = (app) => {
  app.get('/authorize', function(req, res) {
    if(!req.isAuthenticated() || !req.user) {
      return res.redirect(`/login?redirectTo=${encodeURIComponent(req.originalUrl)}`)
    }
    
    const prefix = '<!DOCTYPE html><html><head><title>Authorize</title></head><body>' +
      '<form action="/authorize" method="POST"><input type="hidden" name="grant_type" value="code" />' +
      '<h4>Authorize Google assistant to control your devices</h4>';
    const inputs = Object.keys(req.query).reduce((html, key) => 
      html + `<input type="hidden" name="${key}" value="${req.query[key]}" />`, '');
    const postfix = '<button type="submit">Authorize</button></form></body></html>'
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
}
