const MDNS = require('../controllers/mdns');
const DeviceModel = require('../models/devices');
const Bluebird = require('bluebird');
const request = Bluebird.promisify(require('request'));

const DNS = require('dns');
const lookup = Bluebird.promisify(DNS.lookup, {context: DNS});

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
    });

    app.post('/devices/:name', (req, res) => {
        const devName = req.params.name;
        const { switchId, newState } = req.body;

        DeviceModel.findOne({user: req.user.email, name: devName})
            .then(device => {
                if(!device) {
                    throw new Error('UNAUTHORIZED');
                }
                return lookup(`${devName}.local`, {family: 4})
                    .then(ip=> {
                        return request(`http://${ip}:${device.port || '80'}/v1/ops?dev=${switchId}&state=${newState}`)
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
};
