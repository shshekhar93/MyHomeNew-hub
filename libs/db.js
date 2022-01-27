'use strict';

import nconf from 'nconf';
import mongoose from 'mongoose';
import { logInfo, logError } from './logger.js';

nconf.env().file({ file: 'config/config.json' });

const connect = () => {
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

export { connect };
