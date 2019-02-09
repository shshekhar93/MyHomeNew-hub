const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const morgan = require('morgan');

const MDNS = require('./controllers/mdns');
const routes = require('./routes');
const DB = require('./controllers/db');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('./dist'));
app.use(morgan('tiny'));

app.use(session({ 
    secret: 'keyboard cat',
    saveUninitialized: true,
    resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

routes.setupRoutes(app);

MDNS.startDiscovery();
DB.connect();

app.listen(8080);
