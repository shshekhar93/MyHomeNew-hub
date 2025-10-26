import mongoose from 'mongoose';
const { Schema } = mongoose;

export enum AuthorizationRole {
  OPERATOR = 'operator',
  ADMINISTRATOR = 'administrator',
};

export type DeviceAuthorizationT = {
  deviceId: string; // _id from device model
  userId: string; // _id from user model
  authorizationDate: Date;
  expiresAt: Date | null;
  role: AuthorizationRole;
};

export const DeviceAuthorizationSchema = new Schema({
  deviceId: { type: String, required: true }, // _id from device model
  userId: { type: String, required: true }, // _id from user model
  authorizationDate: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  role: { type: String, enum: Object.values(AuthorizationRole), required: true },
});

export const DeviceAuthorizationModel = mongoose.model<DeviceAuthorizationT>(
  'DeviceAuthorization',
  DeviceAuthorizationSchema,
);
