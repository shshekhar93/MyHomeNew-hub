const MDNS = require('../libs/mdns');
const DeviceModel = require('../models/devices');
const Bluebird = require('bluebird');
const request = Bluebird.promisify(require('request'));
const _pickBy = require('lodash/pickBy');
const DNS = require('dns');

const { authorize } = require('../libs/passport');
const schemaTransformer = require('../libs/helpers').schemaTransformer.bind(null, null);

const lookup = Bluebird.promisify(DNS.lookup, {context: DNS});

module.exports = (app) => {
    app.get('/devices/available', authorize, (req, res) => res.json(MDNS.getKnownDevices()));

    app.get('/devices', authorize, (req, res) => {
        // Get list of devices for current user
        DeviceModel.find({user: req.user.email}).lean()
            .then(devices => {
                devices = devices.map(schemaTransformer);
                // Get current state of device(s).
                return Bluebird.map(devices, (device) => 
                    lookup(`${device.name}.local`, { family: 4 })
                        .then(ip => {
                            return ip;
                        })
                        .then(ip => request(`http://${ip}/v1/config`))
                        .then(resp => {
                            if(resp.statusCode > 299) {
                                return Object.assign(device, {
                                    isActive: false
                                });
                            }
                            
                            const leadsMap = device.leads.reduce(((orig, lead) => Object.assign(orig, {[lead.devId + 1]: lead})), {});
                            const respBody = JSON.parse(resp.body);

                            device.isActive = true;
                            Object.keys(respBody).filter(lead => lead.indexOf('lead') === 0).forEach(lead => {
                                const devId = lead.replace('lead', '');
                                leadsMap[devId] && (leadsMap[devId].brightness = respBody[lead]);
                            });
                            return device;
                        })
                        .catch(err => {
                            console.log(err);
                            return device;
                        })
                );
            })
            .then(devices => res.json(devices))
            .catch(err => {
                res.json({err})
            });
    });

    app.post('/devices', authorize, (req, res) => {
        const device = req.body;
        device.user = req.user.email;

        DeviceModel.create(device)
            .then(() => res.json({success: true}))
            .catch(err => res.json({success: false, err}));
    });

    app.post('/devices/:name', authorize, (req, res) => {
        const devName = req.params.name;
        const { switchId, newState } = req.body;

        DeviceModel.findOne({user: req.user.email, name: devName})
            .then(device => {
                if(!device) {
                    throw new Error('UNAUTHORIZED');
                }
                return lookup(`${devName}.local`, {family: 4})
                    .then(ip=> {
                        return request(`http://${ip}:${device.port || '80'}/v1/ops?dev=${switchId}&brightness=${newState}`)
                    });
            })
            .then(resp =>  {
                res.json({
                    success: true
                });
            })
            .catch(err => {
                console.log(err);
                res.status(400).json({ success: false, err });
            });
    });

    app.get('/devices/:name', authorize, (req, res) => {
        return lookup(`${req.params.name}.local`, {family: 4})
            .then(ip => request(`http://${ip}/v1/config`))
            .then(resp => {
                if(resp.statusCode > 299) {
                    throw new Error('api call failed');
                }
                const respBody = JSON.parse(resp.body);
                return _pickBy(respBody, (val, key) => key.indexOf('lead') === 0);
            })
            .then(resp => res.json(resp))
            .catch(err => {
                res.status(400).json({
                    err: err.message || err
                });
            });
    });
};
