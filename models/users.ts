'use strict';

import mongoose from 'mongoose';
import { transformer } from '../libs/helpers.js';

const { Schema } = mongoose;

export type UserT = {
  name: string;
  email: string;
  username: string;
  password: string;
  hubClientId: string;
  hubClientSecret: string;
  createdDate: Date;
  updatedDate: Date;
};

const UserSchema = new Schema(
  {
    name: String,
    email: String,
    username: {
      type: String,
      unique: true,
      dropDups: true,
    },
    password: String,
    hubClientId: String,
    hubClientSecret: String,
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
  },
  transformer,
);

const UserModel = mongoose.model<UserT>('Users', UserSchema);
export default UserModel;
