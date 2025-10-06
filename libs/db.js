'use strict';

import nconf from 'nconf';
import mongoose from 'mongoose';
import { logInfo, logError } from './logger.js';

nconf.env().file({ file: 'config/config.json' });

const connect = async (retry = true) => {
  const connectionStr = nconf.get('MONGO_CONNECT_STR');

  try {
    await mongoose.connect(connectionStr, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      autoIndex: false,
    });

    logInfo('Database connected!');
  }
  catch (err) {
    logError(`Database connection failed: ${err.message}`);
    if (retry) {
      logInfo('Retrying db connection');
      await connect(false);
    }
  }
};

export { connect };
