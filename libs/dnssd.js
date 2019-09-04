'use strict';

const _cloneDeep = require('lodash/cloneDeep');
const _get = require('lodash/get');
const dns = require('dns');
const util = require('util');
const lookup = util.promisify(dns.lookup);
const dnssd = require('dnssd');
const devices = {};

try {
  dnssd.Browser(dnssd.tcp('http'))
    .on('serviceUp', function(service) {
      const {
        name = '', host = '', port = 80, addresses = []
      } = service;
      const ip = addresses.find(address => (address || '').split('.').length === 4);

      if(name.startsWith('myhomenew') && host && ip) {
        devices[name] = { host, ip, port };
        console.log('found', devices[name]);
      }
    })
    .on('serviceDown', function(service) {
      const { name = '' } = service;

      if(devices[name]) {
        console.log('lost', devices[name]);
        devices[name] = undefined;
      }
    })
    .on('error', function(err) {
      console.error(err);
    }).start();
    
} catch(e) {
  console.error('could not create browser.')
}

module.exports.getKnownDevices = () => _cloneDeep(devices);
module.exports.resolve = (name) => {
  if(devices[name]) {
    return Promise.resolve(devices[name].ip);
  }
  
  return dnssd.resolve(`${name}.local.`, 'A')
    .then(result => console.log('miss') || _get(result, 'answer.address'))
    .catch(() => lookup(`${name}.local`, { family: 4 }));
};
