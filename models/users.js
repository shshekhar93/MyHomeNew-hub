'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const { transformer } = require('../libs/helpers');

const UserSchema = new Schema({
  name: String,
  email: String,
  username: {
    type: String,
    unique: true,
    dropDups: true
  },
  password: String,
  hubClientId: String,
  hubClientSecret: String,
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now }
}, transformer);

module.exports = mongoose.model('Users', UserSchema);
