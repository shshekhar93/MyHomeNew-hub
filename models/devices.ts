'use strict';

import mongoose from 'mongoose';
import { transformer } from '../libs/helpers.js';

const { Schema } = mongoose;

export type DeviceInteractionUnitT = {
  devId: number;
  label: string;
  state: string;
  type: string;
  hasPwm: boolean;
};

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

export type DeviceModelT = {
  name: string;
  label: string;
  user: string;
  room: string;
  hostname: string;
  port: number;
  encryptionKey: string;
  leads: DeviceInteractionUnitT[];
};
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

const DeviceModel = mongoose.model<DeviceModelT>('Devices', DeviceSchema);
export default DeviceModel;
