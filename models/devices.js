'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const DeviceInteractionUnitSchema = new Schema({
    devId: Number,
    label: String,
    state: String,
    hasPwm: Boolean
});

const DeviceSchema = new Schema({
    name: String,
    label: String,
    user: String,
    room: String,
    hostname: String,
    port: Number,
    leads: [DeviceInteractionUnitSchema]
});

module.exports = mongoose.model('Devices', DeviceSchema);
