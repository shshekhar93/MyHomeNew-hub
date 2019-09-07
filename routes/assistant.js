'use strict';
const _get = require('lodash/get');
const {
  syncDevices, queryStatus, execute
} = require('../controllers/assistant');

module.exports =  app => {
  app.post('/assistant/fullfill', app.oAuth.authenticate(), (req, res) => {
    console.log('Assistant req', JSON.stringify(req.body, null, 2));
    console.log('user', _get(res, 'locals.oauth.token.user.email'));
    
    const type = _get(req.body, 'inputs[0].intent');

    if(type === 'action.devices.SYNC') {
      return syncDevices(req, res);
    }

    if(type === 'action.devices.QUERY') {
      return queryStatus(req, res);
    }

    if(type === 'action.devices.EXECUTE') {
      return execute(req, res);
    }

    // Invalid request
    return res.status(400).json({});
  });
}
