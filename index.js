const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('./libs/redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const passport = require('passport');
const OAuthServer = require('express-oauth-server');
const morgan = require('morgan');

const routes = require('./routes');
const DB = require('./libs/db');
const OAuthModel = require('./models/oAuth');
const { proxyRequestsSetup } = require('./controllers/proxy');
const WSServer = require('./libs/ws-server');

const _get = require('lodash/get');
const config = require('./config/config.json');

const app = express();
app.oAuth = new OAuthServer({
    debug: true,
    model: OAuthModel
});

if(process.env.mode === 'development') {
  const webpack = require('webpack');
  const middleware = require('webpack-dev-middleware');
  const config = require('./webpack.config');
  config.mode='development';
  config.devtool = 'cheap-eval-source-map';
  const compiler = webpack(config);
  app.use(middleware(compiler, { index: false, lazy: true, publicPath: '/js/' }))
}

app.use(express.static('./dist'));
app.use(express.static('./public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('tiny'));

app.use(session({ 
    secret: 'keyboard cat',
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
    store: new RedisStore({
      client: Redis.client,
      ttl: 7 * 24 * 60 * 60
    })
}));

app.use(passport.initialize());
app.use(passport.session());

if(config.external_server) {
  const server = config.external_server;
  const id = _get(config, 'hub_credentials.id');
  const secret = _get(config, 'hub_credentials.secret');
  const email = _get(config, 'hub_credentials.hub_user_email');
  if(id && secret && email) {
    app.use(proxyRequestsSetup({ server, id, secret, email }));
  }
}

const PWA_HOST = 'https://pwa.applyed.in';
app.use(function(req, res, next) {
    const origin = req.get('Origin');
    if(origin === PWA_HOST) {
        res.set({
            'Access-Control-Allow-Headers': 'authorization',
            'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS',
            'Access-Control-Allow-Origin': PWA_HOST
        });
    }
    next();
});

routes.setupRoutes(app);

DB.connect();
Redis.connect();

const server =  http.createServer(app);
WSServer.start(server);
server.listen(process.env.PORT || 8020);
