'use strict';
const MDNS = require('../controllers/mdns');

const authMiddleware = function(req, res, next) {
    if(!req.isAuthenticated() || !req.user){
      return res.status(401).json({});
    }
    next();
};

module.exports = (app) => {
    app.get('/devices/available', authMiddleware, (req, res) => res.json(MDNS.getKnownDevices()));
    app.get('/devices/', authMiddleware, (req, res) => {
        // Get list of devices for current user
        res.json([]);
    });
};