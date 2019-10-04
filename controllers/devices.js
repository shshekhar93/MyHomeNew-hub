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
  if(dnssd.getKnownDevices()[_get(req, 'body.name')] === undefined) {
    return res.json({
      success: false,
      err: 'Device not online'
    });
  }

  return DeviceModel.create({
    user: req.user.email,
    ...req.body
  })
  .then(() => res.json({
    success: true
  }))
  .catch(err => res.status(400).json({
    success: false, 
    err: err.message
  }));
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
          isActive: !!dnssd.getKnownDevices()[device.name],
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

  DeviceModel.findOne({ name: devName})
    .then(device => {
      if(!device) {
        throw new Error('UNAUTHORIZED');
      }
      return getRequestToDevice(
        device.name,
        device.port || '80',
        `/v1/ops?dev=${switchId}&brightness=${newState}`
      );
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
    .then(otk => {
      const user = _get(req, 'user._id');
      return (new DeviceSetupModel({otk, user})).save();
    })
    .then(doc => {
      res.json({
        otk: doc.otk
      });
    })
    .catch(err => {
      console.log('OTK generation failed!', err.stack);
      res.status(400).json({
        error: err.message
      });
    })
};
