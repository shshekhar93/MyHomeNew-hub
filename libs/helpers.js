'use strict';
const _omit = require('lodash/omit');
const _get = require('lodash/get');
const util = require('util');
const request = util.promisify(require('request'));
const { exec } = require('child_process');
const os = require('os');
const ip = require('ip');
const dnssd = require('./dnssd');

const IGNORED_KEYS = ['__v'];
const schemaTransformer = module.exports.schemaTransformer = (doc, ret) => {
    return _omit(ret, IGNORED_KEYS);
};

module.exports.trasformer = {
    toObject: {
        transform: schemaTransformer
    },
    toJSON: {
        transform: schemaTransformer
    }
};

module.exports.getRequestToDevice = (devName, devPort, url) => {
    return dnssd.resolve(devName)
        .then(ip => {
          if(typeof ip === 'object') {
            console.log('got object for ip', JSON.stringify(ip));
          }
          return request(`http://${ip}:${devPort}${url}`)
        })
        .then(resp => {
            if(resp.statusCode > 299) {
                throw new Error('API call failed!');
            }
            try {
                return JSON.parse(resp.body);
            } catch(e) {
                return "";
            }
        });
};

module.exports.series = (arr, mapper, others = []) => {
  const firstElem = arr.shift();
  if(!firstElem) {
    return Promise.resolve([]);
  }

  const elemP = mapper(firstElem);
  return elemP.then((thisResp) => {
    const allResps = [...others, thisResp];
    if(arr.length > 0) {
      return module.exports.series(arr, mapper, allResps)
    }
    return allResps;
  });
};

module.exports.wakeAllDevices = () => {
  try {
    const allInterfaces = os.networkInterfaces();
    const theInterfaces = Object.entries(allInterfaces).map(([name, interf]) => {
      const ipv4Int = interf.find(({family}) => family === 'IPv4');
      if(ipv4Int.address.startsWith('192.') || ipv4Int.address.startsWith('10.')) {
        return ipv4Int;
      }
      return false;
    }).filter(Boolean);

    if(theInterfaces.length === 0) {
      return;
    }

    theInterfaces.forEach(theInterface => {
      const {broadcastAddress} = ip.subnet(theInterface.address, theInterface.netmask) || {};
      exec(`ping -c2 ${process.platform !== 'win32' ? '-b': ''} ${broadcastAddress}`, {
        timeout: 3000
      }, function(err) {
        if(err) {
          return console.log('wake up broadcast failed!', err.stack || err);
        }
        console.log('wake pings completed!');
      });
    });
  } catch(e){ console.log(e.stack) }
};
