'use strict';
const _get = require('lodash/get');
const deviceModel = require('../models/devices');

module.exports =  app => {
  app.post('/assistant/fullfill', app.oAuth.authenticate(), (req, res) => {
    console.log('Assistant req', JSON.stringify(req.body, null, 2));
    console.log('user', _get(res, 'locals.oauth.token.user.email'));
    deviceModel.find({user: _get(res, 'locals.oauth.token.user.email')})
      .then(devices => {
        res.send({
          requestId: req.body.requestId,
          payload: {
            agentUserId: _get(res, 'locals.oauth.token.user._id'),
            devices: devices.map(deviceMapper)
          }
        });
      });
  });
}

function deviceMapper(device) {
  return {
    id: device._id,
    type: 'action.devices.types.LIGHT',
    traits: [
      'action.devices.traits.OnOff'
    ],
    name: {
      defaultNames: [device.name],
      name: device.leads[0].label,
      nicknames: [device.label]
    },
    willReportState: false,
    roomHint: device.room,
    deviceInfo: {
      manufacturer: 'Shashi',
      model: 'v0.0.1',
      hwVersion: '0.0.1',
      swVersion: '0.0.1'
    }
  };
}
