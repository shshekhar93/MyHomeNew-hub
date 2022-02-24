import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import connectRedis from 'connect-redis';
import passport from 'passport';
import OAuthServer from 'express-oauth-server';
import _get from 'lodash/get.js';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

import { setupRoutes } from './routes/index.js';
import * as Redis from './libs/redis.js';
import * as DB from './libs/db.js';
import * as OAuthModel from './models/oAuth.js';
import { proxyRequestsSetup } from './controllers/proxy.js';
import { start as startWSServer } from './controllers/ws/server.js';
import config from './libs/config.js';
import { logMiddleware } from './libs/logger.js';
import webpackConfig from './webpack.config.cjs';

const RedisStore = connectRedis(session);
const app = express();
app.oAuth = new OAuthServer({
  debug: true,
  model: OAuthModel,
});

if (process.env.mode === 'development') {
  webpackConfig.mode = 'development';
  webpackConfig.devtool = 'eval-cheap-source-map';
  const compiler = webpack(webpackConfig);
  app.use(
    webpackDevMiddleware(compiler, {
      index: false,
      publicPath: '/js/',
    })
  );
}

app.use(express.static('./dist'));
app.use(express.static('./public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(logMiddleware);

app.use(
  session({
    secret: 'keyboard cat',
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
    store: new RedisStore({
      client: Redis.client,
      ttl: 7 * 24 * 60 * 60,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

if (config.external_server) {
  const server = config.external_server;
  const id = _get(config, 'hub_credentials.id');
  const secret = _get(config, 'hub_credentials.secret');
  const email = _get(config, 'hub_credentials.hub_user_email');
  if (id && secret && email) {
    app.use(proxyRequestsSetup({ server, id, secret, email }));
  }
}

const PWA_HOST = 'https://pwa.applyed.in';
app.use(function (req, res, next) {
  const origin = req.get('Origin');
  if (origin === PWA_HOST) {
    res.set({
      'Access-Control-Allow-Headers': 'authorization',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS',
      'Access-Control-Allow-Origin': PWA_HOST,
    });
  }
  next();
});

setupRoutes(app);

DB.connect();
Redis.connect();

const server = http.createServer(app);
startWSServer(server);
server.listen(process.env.PORT || 8020);
