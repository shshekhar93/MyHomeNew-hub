'use strict';

const nconf = require('nconf');
const mongoose = require('mongoose');
const { logInfo, logError } = require('./logger');

nconf.env().file({ file: 'config/config.json' });

module.exports.connect = () => {
    const connectionStr = nconf.get('MONGO_CONNECT_STR');

    mongoose.connect(connectionStr, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        autoIndex: false
    })
    .then(() => {
        logInfo('Database connected!');
    })
    .catch(err => {
        logError(`Database connection failed: ${err.message}`);
    });
};
