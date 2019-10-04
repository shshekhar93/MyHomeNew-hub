'use strict';
const { authorize } = require('../libs/passport');
const { 
    getAvailableDevices, 
    saveNewDeviceForUser, 
    switchDeviceState, 
    getDeviceConfig, 
    getAllDevicesForUser,
    generateOTK
} = require('../controllers/devices');

module.exports = (app) => {
    app.get('/devices/available', authorize, getAvailableDevices);

    app.post('/devices', authorize, saveNewDeviceForUser);
    app.get('/devices', authorize, getAllDevicesForUser);

    app.post('/devices/new', authorize, generateOTK);
    
    app.post('/devices/:name', switchDeviceState);
    app.get('/devices/:name', authorize, getDeviceConfig);
};
