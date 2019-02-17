'use strict';
const { authorize } = require('../libs/passport');
const { 
    getAvailableDevices, 
    saveNewDeviceForUser, 
    switchDeviceState, 
    getDeviceConfig, 
    getAllDevicesForUser 
} = require('../controllers/devices');

module.exports = (app) => {
    app.get('/devices/available', authorize, getAvailableDevices);

    app.post('/devices', authorize, saveNewDeviceForUser);
    app.get('/devices', authorize, getAllDevicesForUser);
    app.post('/devices/:name', authorize, switchDeviceState);
    app.get('/devices/:name', authorize, getDeviceConfig);
};
