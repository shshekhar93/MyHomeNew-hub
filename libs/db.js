'use strict';

const nconf = require('nconf');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

nconf.env().file({ file: 'config/config.json' });

module.exports.connect = () => {
    const connectionStr = nconf.get('MONGO_CONNECT_STR');

    mongoose.connect(connectionStr, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        autoIndex: false
    })
    .then(() => {
        console.log('connected to db');
    })
    .catch(err => {
        console.log('DB connection failed: ', err);
    });
};
