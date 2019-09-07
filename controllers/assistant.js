'use strict';
const _get = require('lodash/get');
const deviceModel = require('../models/devices');
const { getRequestToDevice } = require('../libs/helpers');
const { getDevState } = require('./devices');

function syncDevices(req, res) {
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

function reduceDevsToQueryResp(resp, dev) {
  return Object.assign(resp, {
    [dev._id]: {
      on: _get(dev, 'leads[0].brightness', 0) === 100,
      online: dev.isActive
    }
  });
}

function queryStatus(req, res) {
  const devicesToQuery = _get(req.body, 'inputs[0].payload.devices', []);
  Promise.all(devicesToQuery.map(dev => deviceModel.findById(dev.id).lean()))
    .then(devObjs => Promise.all(
      devObjs.map(dev => getDevState(dev))
    ))
    .then(allDeviceStates => {
      res.json({
        requestId: req.body.requestId,
        payload: {
          devices: allDeviceStates.reduce(reduceDevsToQueryResp, {})
        }
      });
    })
}

function execute(req, res) {
  const commands = _get(req.body, 'inputs[0].payload.commands', []);

  commands.map(command => {
    const devices = _get(command, 'devices', []);
    const applicableCmd = _get(command, 'execution', [])
      .find(exec => exec.command === 'action.devices.commands.OnOff');
    const isOn = _get(applicableCmd, 'params.on');

    return Promise.all(devices.map(dev => deviceModel.findById(dev.id).lean()))
      .then(allDevices => Promise.all(
        allDevices.map(device => 
          getRequestToDevice(
            device.name, 
            device.port || '80', 
            `/v1/ops?dev=${_get(device, 'leads[0].devId', 0)}&brightness=${isOn? 100 : 0}`
          )
            .then(() => ({
              id: device._id,
              status: 'SUCCESS'
            }))
            .catch(err => {
              console.log('device state update failed', err.stack || err);
              return { id: device._id, status: 'ERROR' };
            })
        )
      ))
      .then(allResponses => {
        const successIds = allResponses.filter(r => r.status === 'SUCCESS').map(r => r.id);
        const errorIds = allResponses.filter(r => r.status === 'ERROR').map(r => r.id);
        res.json({
          requestId: req.body.requestId,
          payload: {
            commands: [
              successIds.length && {
                ids: successIds,
                status: 'SUCCESS',
                states: {
                  on: isOn,
                  online: true
                }
              },
              errorIds.length && {
                ids: errorIds,
                status: 'ERROR'
              }
            ].filter(Boolean)
          }
        });
      })
  });
}

module.exports = {
  syncDevices,
  queryStatus,
  execute
};
