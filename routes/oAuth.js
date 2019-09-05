'use strict';
const { authorize } = require('../libs/passport');

module.exports = (app) => {
  app.get('/authorize', function(req, res) {
    res.send(JSON.stringify(req.query));
  });
  app.post('/authorize', authorize, app.oAuth.authorize());
  app.post('/token', app.oAuth.token());
}
