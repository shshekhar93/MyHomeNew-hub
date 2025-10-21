import mongoose from 'mongoose';
const { Schema } = mongoose;

export type DeviceSetupT = {
  name: string;
  type: string;
  encryptionKey: string;
  creationDate: Date;
  user: string; // _id from user model
};

const DeviceSetupSchema = new Schema({
  name: String,
  type: String,
  encryptionKey: { type: String, required: true },
  creationDate: { type: Date, default: Date.now },
  user: { type: String, require: true }, // _id from user model
});

const DeviceSetupModel = mongoose.model<DeviceSetupT>('DeviceSetup', DeviceSetupSchema);
export default DeviceSetupModel;
