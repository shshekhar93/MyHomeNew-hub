'use strict';

const nconf = require('nconf');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

nconf.env().file({ file: 'config/config.json' });

module.exports.connect = () => {
    const user = nconf.get('MONGO_DB_USER');
    const password = nconf.get('MONGO_DB_PASS');
    const host = nconf.get('MONGO_DB_HOST');
    const port = nconf.get('MONGO_DB_PORT');

    mongoose.connect(`mongodb+srv://${user}:${password}@${host}/myhomenew?retryWrites=true&w=majority`, {
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
