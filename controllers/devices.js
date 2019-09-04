'use strict';

const Bluebird = require('bluebird');
const _pickBy = require('lodash/pickBy');

const dnssd = require('../libs/dnssd');
const DeviceModel = require('../models/devices');
const { getRequestToDevice } = require('../libs/helpers');
const schemaTransformer = require('../libs/helpers').schemaTransformer.bind(null, null);

module.exports.getAvailableDevices = (req, res) => {
  res.json(dnssd.getKnownDevices());
};

module.exports.saveNewDeviceForUser = (req, res) => {
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

async function getDevState(device) {
  return getRequestToDevice(device.name, device.port || '80', '/v1/config')
    .then(resp => ({
      ...device,
      isActive: true,
      leads: device.leads.map(schemaTransformer).map(mapBrightness.bind(null, resp))
    }))
    .catch(err => {
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
    .then(devices => Promise.all(devices.map(schemaTransformer).map(getDevState)))
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
            return getRequestToDevice(device.name, device.port || '80', `/v1/ops?dev=${switchId}&brightness=${newState}`)
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
