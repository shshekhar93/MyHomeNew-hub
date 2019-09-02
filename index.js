const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport');
const morgan = require('morgan');

const MDNS = require('./libs/mdns');
const routes = require('./routes');
const DB = require('./libs/db');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('./dist'));
app.use(express.static('./public'));
app.use(morgan('tiny'));

app.use(session({ 
    secret: 'keyboard cat',
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
    store: new SQLiteStore
}));

app.use(passport.initialize());
app.use(passport.session());

routes.setupRoutes(app);

MDNS.startDiscovery();
DB.connect();

app.listen(8090);
