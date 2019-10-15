'use strict';
const path = require('path');
const fs = require('fs');

const semver = require('semver');
const _get = require('lodash/get');
const _omit = require('lodash/omit');
const _pickBy = require('lodash/pickBy');
const {randomBytes, encrypt} = require('../libs/crypto');

const DeviceModel = require('../models/devices');
const DeviceSetupModel = require('../models/device-setup');
const schemaTransformer = require('../libs/helpers').schemaTransformer.bind(null, null);
const { isDevOnline, requestToDevice } = require('../libs/ws-server');

module.exports.getAvailableDevices = (req, res) => {
  const user = _get(req, 'user._id');
  DeviceSetupModel.find({ user }).lean()
    .then(pendingDevices => {
      const availableDevs = pendingDevices.filter(d => !!d.name)
        .reduce((all, d) => ({...all, [d.name]: d}), {});
      res.json(availableDevs);
    })
    .catch(err => {
      console.error('failed to find pending devices', err.stack);
      res.status(400).json({});
    })
};

module.exports.saveNewDeviceForUser = (req, res) => {
  return DeviceSetupModel.findOne({
    user: _get(req, 'user._id'),
    name: _get(req, 'body.name')
  })
    .then(dev2Setup => {
      if(!dev2Setup) {
        throw new Error('Device not available to setup')
      }

      // if(!isDevOnline(dev2Setup.name)) {
      //   throw new Error('Device not online');
      // }

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

module.exports.getDevState = async (device, retries = 2) => {
  return requestToDevice(device.name, {
    action: 'get-state'
  })
    .then(resp => ({
      ..._omit(device, 'encryptionKey'),
      isActive: true,
      leads: device.leads.map(schemaTransformer).map(mapBrightness.bind(null, resp))
    }))
    .catch(err => {
      console.error('getDevState failed', err);
      return {
        ..._omit(device, 'encryptionKey'),
        isActive: false
      };
    });
}

module.exports.getAllDevicesForUser = (req, res) => {
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

const updateDeviceState = module.exports.updateDeviceState = (user, devName, switchId, newState) => {
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

module.exports.switchDeviceState = (req, res) => {
  const devName = req.params.name;
  const { switchId, newState } = req.body;

  updateDeviceState(_get(req, 'user.email'), devName, switchId, newState)
    .then(() => res.json({
      success: true
    }))
    .catch(err => {
      console.log(err);
      res.status(400).json({ success: false, err });
    });
};

module.exports.getDeviceConfig = (req, res) => {
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

module.exports.generateOTK = (req, res) => {
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
      console.log('OTK generation failed!', err.stack);
      res.status(400).json({
        error: err.message
      });
    })
};

module.exports.triggerFirmwareUpdate = (req, res) => {
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
          const latestFirmWare = fs.readFileSync(path.join(__dirname, `../firmwares/${hardwareVer}.latest`));
    
          const updateRequired = semver.gt(latestFirmWare, softwareVer);
          if(!updateRequired) {
            return res.json({ message: 'Already up-to-date' });
          }
    
          const firmwarePath = `firmwares/${hardwareVer}/${latestFirmWare}/firmware.bin`
          requestToDevice({
            action: 'firmware-update',
            data: `/v1/${name}/get-firmware/${encrypt(`${firmwarePath}-1`, device.encryptionKey)}`
          });
        });
    })
    .catch(err => {
      console.error('TRIGGER_UPDATE_FAILED', err.message);
      res.status(400).json({ error: err.message });
    });
};
