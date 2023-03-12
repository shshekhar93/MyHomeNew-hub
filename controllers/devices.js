import semver from 'semver';
import _get from 'lodash/get.js';
import _omit from 'lodash/omit.js';
import _pickBy from 'lodash/pickBy.js';
import _keyBy from 'lodash/keyBy.js';
import { randomBytes, encrypt } from '../libs/crypto.js';

import DeviceModel from '../models/devices.js';
import DeviceSetupModel from '../models/device-setup.js';
import { isDevOnline, requestToDevice } from './ws/server.js';
import { logError, logInfo } from '../libs/logger.js';
import {
  schemaTransformer,
  catchAndRespond,
  errResp,
} from '../libs/helpers.js';
import { validate } from '../validations/common.js';
import { DeviceSchema } from '../validations/schemas.js';
import { getFirmwareFile } from '../libs/esm-utils.js';

const transformer = schemaTransformer.bind(null, null);

const getAvailableDevices = catchAndRespond(async (req, res) => {
  const user = _get(req, 'user._id');
  const pendingDevices = await DeviceSetupModel.find({ user }).lean();
  const availableDevs = _keyBy(pendingDevices, 'name');

  // Clear devices that didn't have a name.
  availableDevs.undefined = undefined;
  res.json(availableDevs);
});

const saveNewDeviceForUser = catchAndRespond(async (req, res) => {
  const dev2Setup = await DeviceSetupModel.findOne({
    user: _get(req, 'user._id'),
    name: _get(req, 'body.name'),
  });

  if (!dev2Setup) {
    throw new Error('Device not available to setup');
  }

  await DeviceModel.create({
    ...req.body,
    user: req.user.email,
    encryptionKey: dev2Setup.encryptionKey,
  });
  await DeviceSetupModel.deleteOne({ _id: dev2Setup._id });

  res.json({
    success: true,
  });
});

function mapBrightness(devConfig, lead) {
  return {
    ...lead,
    brightness: devConfig[`lead${lead.devId}`] || 0,
  };
}

const queryDevice = catchAndRespond(async (req, res) => {
  const device = await DeviceModel.find({
    name: req.params.name,
  }).lean();
  res.json(await getDevState(device));
});

const getDevState = async (device, retries = 2) => {
  const resFields = {
    ..._omit(device, 'encryptionKey'),
    isActive: false,
  };
  try {
    const deviceState = await requestToDevice(device.name, {
      action: 'get-state',
    });

    return {
      ...resFields,
      isActive: true,
      leads: device.leads
        .map(transformer)
        .map(mapBrightness.bind(null, deviceState)),
    };
  } catch (err) {
    logError(err);
    return resFields;
  }
};

const getAllDevicesForUser = catchAndRespond(async (req, res) => {
  const devices = await DeviceModel.find({ user: req.user.email }).lean();
  res.json(
    devices.map(transformer).map((device) => ({
      ..._omit(device, 'encryptionKey'),
      isActive: isDevOnline(device.name),
      leads: device.leads.map((lead) => ({ ...lead, brightness: lead.state })),
    }))
  );
});

const updateDeviceState = async (user, devName, switchId, newState) => {
  const device = await DeviceModel.findOne({ name: devName, user });
  if (!device) {
    throw new Error('UNAUTHORIZED');
  }

  await requestToDevice(devName, {
    action: 'set-state',
    data: `${switchId}=${newState}`,
  });

  await DeviceModel.updateOne(
    {
      name: devName,
      'leads.devId': switchId,
    },
    {
      'leads.$.state': newState,
    }
  );
};

const switchDeviceState = catchAndRespond(async (req, res) => {
  const { name } = req.params;
  const { switchId, newState } = req.body;

  await updateDeviceState(_get(req, 'user.email'), name, switchId, newState);
  res.json({
    success: true,
  });
});

const RETAINED_DEVICE_FIELDS = [
  'name',
  'user',
  'hostname',
  'port',
  'encryptionKey',
];

const RETAINED_LEAD_FIELDS = ['state', 'hasPwm'];

const updateExistingDevice = catchAndRespond(async (req, res) => {
  const { name } = req.params;
  const device = req.body;

  const errorField = validate(DeviceSchema, device);
  if (errorField) {
    return res.status(400).json({
      success: false,
      err: 'Invalid object',
      errorField,
    });
  }

  const existing = await DeviceModel.findOne({ name });
  if (!existing) {
    return res.status(404).json(
      errResp({
        err: 'Device not found',
      })
    );
  }

  // Overwrite reatined fields.
  RETAINED_DEVICE_FIELDS.forEach((field) => (device[field] = existing[field]));
  (existing.leads || []).forEach((existing) => {
    const lead = device.leads.find(({ devId }) => devId === existing.devId);
    if (lead) {
      RETAINED_LEAD_FIELDS.forEach((field) => (lead[field] = existing[field]));
    }
  });

  await DeviceModel.updateOne({ name }, device);
  return res.json({ success: true });
});

const getDeviceConfig = catchAndRespond(async (req, res) => {
  const state = await requestToDevice(req.params.name, {
    action: 'get-state',
  });
  res.json(_pickBy(state, (_, key) => key.startsWith('lead')));
});

const generateOTK = catchAndRespond(async (req, res) => {
  const user = _get(req, 'user._id');
  const encryptionKey = await randomBytes(16, 'hex');
  await new DeviceSetupModel({ encryptionKey, user }).save();
  res.json({
    otk: encryptionKey,
  });
});

const triggerFirmwareUpdate = catchAndRespond(async (req, res) => {
  const { name } = req.params;
  const device = await DeviceModel.findOne({ name }).lean();
  if (!device) {
    throw new Error('DEV_NOT_FOUND');
  }
  const resp = await requestToDevice(name, {
    action: 'get-state',
  });

  const { version = '' } = resp;
  const [hardwareVer, softwareVer] = version.split('-');
  const latestFirmWare = await getFirmwareFile(hardwareVer);

  const updateRequired = semver.gt(latestFirmWare, softwareVer);
  if (!updateRequired) {
    return res.json({ message: 'Already up-to-date' });
  }

  const firmwarePath = `firmwares/${hardwareVer}/${latestFirmWare.trim()}/firmware.bin`;
  const updateResp = await requestToDevice(name, {
    action: 'firmware-update',
    data: `/v1/${name}/get-firmware/${encrypt(
      `${firmwarePath}-1`,
      device.encryptionKey
    )}`,
  });
  logInfo(`Firmware update response: ${JSON.stringify(updateResp)}`);
  res.json({ succes: true });
});

export {
  getAvailableDevices,
  saveNewDeviceForUser,
  queryDevice,
  getDevState,
  getAllDevicesForUser,
  updateDeviceState,
  switchDeviceState,
  updateExistingDevice,
  getDeviceConfig,
  generateOTK,
  triggerFirmwareUpdate,
};
