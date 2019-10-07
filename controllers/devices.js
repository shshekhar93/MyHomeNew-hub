'use strict';
const _get = require('lodash/get');
const _omit = require('lodash/omit');
const _pickBy = require('lodash/pickBy');
const {randomBytes} = require('../libs/crypto');

const dnssd = require('../libs/dnssd');
const DeviceModel = require('../models/devices');
const DeviceSetupModel = require('../models/device-setup');
const { getRequestToDevice } = require('../libs/helpers');
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

const RETRY_ERR_CODES = ['EHOSTUNREACH', 'ENOTFOUND'];
;
module.exports.getDevState = async (device, retries = 2) => {
  return getRequestToDevice(device.name, device.port || '80', '/v1/config')
    .then(resp => ({
      ...device,
      isActive: true,
      leads: device.leads.map(schemaTransformer).map(mapBrightness.bind(null, resp))
    }))
    .catch(err => {
      retries--;
      if(RETRY_ERR_CODES.includes(err.code) && // Err requires retry
        retries !== 0 && // We have more retries left
        dnssd.getKnownDevices()[device.name]) // And the device said it is online
      {
        console.warn('retrying bcz of', err.code);
        return module.exports.getDevState(device, retries);
      }

      console.error('getDevState failed', err);
      return {
        ...device,
        isActive: false
      };
    });
}

module.exports.getAllDevicesForUser = (req, res) => {
  // Get list of devices for current user
  return DeviceModel.find({user: req.user.email}).lean()
    .then(devices => {
      // series(devices.map(schemaTransformer), module.exports.getDevState);
      return devices.map(schemaTransformer)
        .map(device => ({
          ...device,
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

module.exports.switchDeviceState = (req, res) => {
  const devName = req.params.name;
  const { switchId, newState } = req.body;

  DeviceModel.findOne({ name: devName, user: _get(req, 'user.email') })
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
    })
    .then(() => res.json({
      success: true
    }))
    .catch(err => {
      console.log(err);
      res.status(400).json({ success: false, err });
    });
};

module.exports.getDeviceConfig = (req, res) => {
  return getRequestToDevice(req.params.name, '80', '/v1/config')
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
