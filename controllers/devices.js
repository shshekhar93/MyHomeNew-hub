'use strict';

const Bluebird = require('bluebird');
const _pickBy = require('lodash/pickBy');

const MDNS = require('../libs/mdns');
const DeviceModel = require('../models/devices');
const { getRequestToDevice } = require('../libs/helpers');
const schemaTransformer = require('../libs/helpers').schemaTransformer.bind(null, null);

module.exports.getAvailableDevices = (req, res) => {
    res.json(MDNS.getKnownDevices());
};

module.exports.saveNewDeviceForUser = (req, res) => {
    return DeviceModel.create({
        user: req.user.email,
        ...req.body
    })
    .then(() => res.json({success: true}))
    .catch(err => res.status(400).json({success: false, err}));
};

module.exports.getAllDevicesForUser = (req, res) => {
    // Get list of devices for current user
    return DeviceModel.find({user: req.user.email}).lean()
        .then(devices =>
            // Get current state of device(s).
            Bluebird.map(devices.map(schemaTransformer), (device) => 
                getRequestToDevice(device.name, device.port || '80', '/v1/config')
                    .then(resp => {
                        device.leads = device.leads.map(schemaTransformer).map(lead => ({
                            brightness: resp[`lead${lead.devId}`] || 0,
                            ...lead
                        }));
                        
                        return {
                            isActive: true,
                            ...device
                        };
                    })
                    .catch((err) => {
                        console.log(err);
                        return {
                            isActive: false,
                            ...device
                        };
                    })
            )
        )
        .then(devices => res.json(devices))
        .catch(err => res.json({
            sucess: false, 
            err
        }));
};

module.exports.switchDeviceState = (req, res) => {
    const devName = req.params.name;
    const { switchId, newState } = req.body;

    DeviceModel.findOne({user: req.user.email, name: devName})
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
