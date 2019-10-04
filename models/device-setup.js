const mongoose = require('mongoose');
const { Schema } = mongoose;

const DeviceSetupSchema = new Schema({
  name: String,
  type: String,
  otk: { type: String, required: true },
  creationDate: {type: Date, default: Date.now },
  encryptionKey: String,
  user: { type: String, require: true } // _id from user model
});

module.exports = mongoose.model('DeviceSetup', DeviceSetupSchema);
