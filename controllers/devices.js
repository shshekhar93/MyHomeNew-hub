'use strict';
import { readFileSync } from 'fs';
import semver from 'semver';
import _get from 'lodash/get.js';
import  _omit from 'lodash/omit.js';
import  _pickBy from 'lodash/pickBy.js';
import  {randomBytes, encrypt} from '../libs/crypto.js';

import DeviceModel from '../models/devices.js';
import DeviceSetupModel from '../models/device-setup.js';
import { isDevOnline, requestToDevice } from '../libs/ws-server.js';
import { logError, logInfo } from '../libs/logger.js';
import * as helpers from '../libs/helpers.js';
import { validate } from '../validations/common.js';
import { DeviceSchema } from '../validations/schemas.js';

const schemaTransformer = helpers.schemaTransformer.bind(null, null);

const getAvailableDevices = (req, res) => {
  const user = _get(req, 'user._id');
  DeviceSetupModel.find({ user }).lean()
    .then(pendingDevices => {
      const availableDevs = pendingDevices.filter(d => !!d.name)
        .reduce((all, d) => ({...all, [d.name]: d}), {});
      res.json(availableDevs);
    })
    .catch(err => {
      logError(err);
      res.status(400).json({});
    })
};

const saveNewDeviceForUser = (req, res) => {
  return DeviceSetupModel.findOne({
    user: _get(req, 'user._id'),
    name: _get(req, 'body.name')
  })
    .then(dev2Setup => {
      if(!dev2Setup) {
        throw new Error('Device not available to setup')
      }

      return DeviceModel.create({
        ...req.body,
        user: req.user.email,
        encryptionKey: dev2Setup.encryptionKey
      })
        .then(() => DeviceSetupModel.deleteOne({ _id: dev2Setup._id }));
    })
    .then(() => res.json({
      success: true
    }))
    .catch(err => {
      return res.status(400).json({
        success: false,
        err: err.message
      });
    });
};

function mapBrightness(devConfig, lead) {
  return {
    ...lead,
    brightness: devConfig[`lead${lead.devId}`] || 0,
  }
}

const queryDevice = (req, res) => {
  DeviceModel.find({ name: req.params.name }).lean()
    .then(module.exports.getDevState)
    .then(resp => res.json(resp))
    .catch(err => res.json({
      success: false,
      error: err.message
    }));
};

const getDevState = async (device, retries = 2) => {
  return requestToDevice(device.name, {
    action: 'get-state'
  })
    .then(resp => ({
      ..._omit(device, 'encryptionKey'),
      isActive: true,
      leads: device.leads.map(schemaTransformer).map(mapBrightness.bind(null, resp))
    }))
    .catch(err => {
      logError(err);
      return {
        ..._omit(device, 'encryptionKey'),
        isActive: false
      };
    });
}

const getAllDevicesForUser = (req, res) => {
  // Get list of devices for current user
  return DeviceModel.find({user: req.user.email}).lean()
    .then(devices => {
      return devices.map(schemaTransformer)
        .map(device => ({
          ..._omit(device, 'encryptionKey'),
          isActive: isDevOnline(device.name),
          leads: device.leads.map(lead => ({ ...lead, brightness: lead.state }))
        }));
    })
    .then(devices => res.json(devices))
    .catch(err => res.json({
      sucess: false, 
      err: err.message || err
    }));
};

const updateDeviceState = (user, devName, switchId, newState) => {
  return DeviceModel.findOne({ name: devName, user })
    .then(device => {
      if(!device) {
        throw new Error('UNAUTHORIZED');
      }
      return requestToDevice(devName, {
        action: 'set-state',
        data: `${switchId}=${newState}`
      });
    })
    .then(() => {
      return DeviceModel.update({
        name: devName,
        'leads.devId': switchId
      }, {
        'leads.$.state': newState
      }).exec();
    });
}

const switchDeviceState = (req, res) => {
  const devName = req.params.name;
  const { switchId, newState } = req.body;

  updateDeviceState(_get(req, 'user.email'), devName, switchId, newState)
    .then(() => res.json({
      success: true
    }))
    .catch(err => {
      logError(err);
      res.status(400).json({ success: false, err });
    });
};

const RETAINED_DEVICE_FIELDS = [
  'name',
  'user',
  'hostname',
  'port',
  'encryptionKey',
];

const RETAINED_LEAD_FIELDS = [
  'state', 
  'hasPwm',
];


const updateExistingDevice = async (req, res) => {
  const { name } = req.params;
  const device = req.body;

  const errorField = validate(DeviceSchema, device)
  if(errorField) {
    return res.status(400).json({
      success: false,
      err: 'Invalid object',
      errorField
    });
  }

  const existing = await DeviceModel.findOne({ name });
  if(!existing) {
    res.status(404).json({ success: false, err: 'Device not found' });
  }

  // Overwrite reatined fields.
  RETAINED_DEVICE_FIELDS.forEach(field => device[field] = existing[field]);
  (existing.leads || []).forEach(existing => {
    const lead = device.leads.find(({devId}) => devId === existing.devId);
    if(lead) {
      RETAINED_LEAD_FIELDS.forEach(field => lead[field] = existing[field])
    }
  });

  await DeviceModel.update({ name }, device);
  return res.json({ success: true });
};

const getDeviceConfig = (req, res) => {
  return requestToDevice(req.params.name, {
    action: 'get-state'
  })
    .then(resp => res.json(_pickBy(resp, (val, key) => key.indexOf('lead') === 0)))
    .catch(err => {
      res.status(400).json({
        success: false,
        err: err.message || err
      });
    });
};

const generateOTK = (req, res) => {
  randomBytes(16, 'hex')
    .then(encryptionKey => {
      const user = _get(req, 'user._id');
      return (new DeviceSetupModel({encryptionKey, user})).save();
    })
    .then(doc => {
      res.json({
        otk: doc.encryptionKey
      });
    })
    .catch(err => {
      logError('OTK generation failed!')
      logError(err);
      res.status(400).json({
        error: err.message
      });
    })
};

const triggerFirmwareUpdate = (req, res) => {
  const { name } = req.params;

  DeviceModel.findOne({name}).lean()
    .then(device => {
      if(!device) {
        throw new Error('DEV_NOT_FOUND');
      }
      return requestToDevice(name, {
        action: 'get-state'
      })
        .then(resp => {
          const { version = '' } = resp;
          const [hardwareVer, softwareVer] = version.split('-');
          const latestFirmWare = readFileSync(new URL(`../firmwares/${hardwareVer}.latest`, import.meta.url), 'utf8');

          const updateRequired = semver.gt(latestFirmWare, softwareVer);
          if(!updateRequired) {
            return res.json({ message: 'Already up-to-date' });
          }
    
          const firmwarePath = `firmwares/${hardwareVer}/${latestFirmWare.trim()}/firmware.bin`
          return requestToDevice(name, {
            action: 'firmware-update',
            data: `/v1/${name}/get-firmware/${encrypt(`${firmwarePath}-1`, device.encryptionKey)}`
          });
        })
        .then(resp => {
          logInfo(`Firmware update response: ${JSON.stringify(resp)}`);
          res.json({ succes: true });
        });
    })
    .catch(err => {
      logError('TRIGGER_UPDATE_FAILED')
      logError(err);
      res.status(400).json({ error: err.message });
    });
};

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
