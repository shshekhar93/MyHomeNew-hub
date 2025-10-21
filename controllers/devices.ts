import semver from 'semver';
import _get from 'lodash/get.js';
import _omit from 'lodash/omit.js';
import _pickBy from 'lodash/pickBy.js';
import _keyBy from 'lodash/keyBy.js';
import { randomBytes, encrypt } from '../libs/crypto.js';

import DeviceModel, { type DeviceInteractionUnitT, type DeviceModelT } from '../models/devices.js';
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
import type { BaseMongooseMixin } from '../types/mongoose-mixins.ts';
import type { Request, Response } from 'express';

const transformer = <T extends object | null | undefined>(ret: T) => schemaTransformer(null, ret);

export const getAvailableDevices = catchAndRespond(async (req: Request, res: Response) => {
  const user = _get(req, 'user._id');
  const pendingDevices = await DeviceSetupModel.find({ user }).lean();
  const availableDevs = _keyBy(pendingDevices, 'name');

  // Clear devices that didn't have a name.
  delete availableDevs.undefined;
  res.json(availableDevs);
});

export const saveNewDeviceForUser = catchAndRespond(async (req: Request, res: Response) => {
  const dev2Setup = await DeviceSetupModel.findOne({
    user: _get(req, 'user._id'),
    name: _get(req, 'body.name'),
  });

  if (!dev2Setup) {
    throw new Error('Device not available to setup');
  }

  await DeviceModel.create({
    ...req.body,
    user: req.user!.email,
    encryptionKey: dev2Setup.encryptionKey,
  });
  await DeviceSetupModel.deleteOne({ _id: dev2Setup._id });

  res.json({
    success: true,
  });
});

function mapBrightness(devConfig: Record<string, number>, lead: DeviceInteractionUnitT) {
  return {
    ...lead,
    brightness: devConfig[`lead${lead.devId}`] || 0,
  };
}

export const queryDevice = catchAndRespond(async (req: Request, res: Response) => {
  const device = await DeviceModel.findOne({
    name: req.params.name,
  }).lean();

  if (!device) {
    return res.status(404).json(errResp({ err: 'Device not found' }));
  }

  if (device.user !== req.user!.email) {
    return res.status(403).json(errResp({ err: 'UNAUTHORIZED' }));
  }

  res.json(await getDevState(device));
});

export const getDevState = async (device: DeviceModelT & BaseMongooseMixin): Promise<Omit<DeviceModelT, 'leads' | 'encryptionKey'> & {
  isActive: boolean;
  leads: (DeviceInteractionUnitT & { brightness: number })[];
}> => {
  const resFields = {
    ..._omit(device, 'encryptionKey'),
    isActive: false,
    leads: device.leads.map(lead => ({ ...lead, brightness: 0 })),
  };
  try {
    const deviceState = await requestToDevice<Record<string, number>>(device.name, {
      action: 'get-state',
    });

    return {
      ...resFields,
      isActive: true,
      leads: device.leads
        .map(transformer)
        .map(lead => mapBrightness(deviceState, lead)),
    };
  }
  catch (err) {
    logError(err);
    return resFields;
  }
};

export const getAllDevicesForUser = catchAndRespond(async (req: Request, res: Response) => {
  const devices = await DeviceModel.find({ user: req.user!.email }).lean();
  res.json(
    devices.map(transformer).map(device => ({
      ..._omit(device, 'encryptionKey'),
      isActive: isDevOnline(device.name),
      leads: device.leads.map(lead => ({ ...lead, brightness: lead.state })),
    })),
  );
});

export const updateDeviceState = async (user: string, devName: string, switchId: string, newState: number) => {
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
    },
  );
};

export const switchDeviceState = catchAndRespond(async (req: Request, res: Response) => {
  const { name } = req.params;
  const userEmail = req.user?.email;
  const { switchId, newState } = req.body;

  if (!userEmail || !name || !switchId || typeof newState !== 'number') {
    return res.status(400).json(errResp({ err: 'INVALID_REQUEST' }));
  }

  await updateDeviceState(_get(req, 'user.email')!, name, switchId, newState);
  res.json({
    success: true,
  });
});

const RETAINED_DEVICE_FIELDS: Array<keyof DeviceModelT> = [
  'name',
  'user',
  'hostname',
  'port',
  'encryptionKey',
];

const RETAINED_LEAD_FIELDS: Array<keyof DeviceInteractionUnitT> = ['state', 'hasPwm'];

export const updateExistingDevice = catchAndRespond(async (req: Request, res: Response) => {
  const { name } = req.params;
  const device = req.body as DeviceModelT;

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
      }),
    );
  }

  // Overwrite reatined fields.
  RETAINED_DEVICE_FIELDS.forEach(field => ((device[field] as unknown) = existing[field]));
  (existing.leads || []).forEach((existing) => {
    const lead = device.leads.find(({ devId }) => devId === existing.devId);
    if (lead) {
      RETAINED_LEAD_FIELDS.forEach(field => ((lead[field] as unknown) = existing[field]));
    }
  });

  await DeviceModel.updateOne({ name }, device);
  return res.json({ success: true });
});

export const getDeviceConfig = catchAndRespond(async (req: Request, res: Response) => {
  const deviceName = req.params.name;
  if (!deviceName) {
    throw new Error('INVALID_REQUEST');
  }

  const state = await requestToDevice(deviceName, {
    action: 'get-state',
  });
  res.json(_pickBy(state, (_, key) => key.startsWith('lead')));
});

export const generateOTK = catchAndRespond(async (req: Request, res: Response) => {
  const user = _get(req, 'user._id');
  const encryptionKey = await randomBytes(16, 'hex');
  await new DeviceSetupModel({ encryptionKey, user }).save();
  res.json({
    otk: encryptionKey,
  });
});

export const triggerFirmwareUpdate = catchAndRespond(async (req: Request, res: Response) => {
  const { name } = req.params;
  if (!name) {
    throw new Error('INVALID_REQUEST');
  }

  const device = await DeviceModel.findOne({ name }).lean();
  if (!device) {
    throw new Error('DEV_NOT_FOUND');
  }

  const resp = await requestToDevice<{ version: string }>(name, {
    action: 'get-state',
  });

  const { version = '' } = resp;
  const [hardwareVer, softwareVer] = version.split('-');
  if (!hardwareVer || !softwareVer) {
    throw new Error('UNABLE_TO_DETERMINE_VERSION');
  }

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
      device.encryptionKey,
    )}`,
  });
  logInfo(`Firmware update response: ${JSON.stringify(updateResp)}`);
  res.json({ succes: true });
});
