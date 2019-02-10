'use strict';
const MDNS = require('../controllers/mdns');
const DeviceModel = require('../models/devices');

const authMiddleware = function(req, res, next) {
    if(!req.isAuthenticated() || !req.user){
      return res.status(401).json({});
    }
    next();
};

module.exports = (app) => {
    app.get('/devices/available', authMiddleware, (req, res) => res.json(MDNS.getKnownDevices()));

    app.get('/devices', authMiddleware, (req, res) => {
        // Get list of devices for current user
        DeviceModel.find({user: req.user.email})
            .then(devices => res.json(devices))
            .catch(err => res.json({err}));
    });

    app.post('/devices', authMiddleware, (req, res) => {
        const device = req.body;
        device.user = req.user.email;

        DeviceModel.create(device)
            .then(() => res.json({success: true}))
            .catch(err => res.json({success: false, err}));
    })
};