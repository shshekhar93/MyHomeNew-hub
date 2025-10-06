'use strict';

import mongoose from 'mongoose';
import { transformer } from '../libs/helpers.js';

const { Schema } = mongoose;

const DeviceInteractionUnitSchema = new Schema(
  {
    devId: Number,
    label: String,
    state: String,
    type: String,
    hasPwm: Boolean,
  },
  transformer,
);

const DeviceSchema = new Schema(
  {
    name: String,
    label: String,
    user: String,
    room: String,
    hostname: String,
    port: Number,
    encryptionKey: String,
    leads: [DeviceInteractionUnitSchema],
  },
  transformer,
);

const DeviceModel = mongoose.model('Devices', DeviceSchema);
export default DeviceModel;
