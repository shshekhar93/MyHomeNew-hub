'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const { transformer } = require('../libs/helpers');

const UserSchema = new Schema({
    name: String,
    email: String,
    password: String,
    googleAuthData: String,
    amazonAuthData: String,
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now }
}, transformer);

module.exports = mongoose.model('Users', UserSchema);
