'use strict';

const _cloneDeep = require('lodash/cloneDeep');
const mdns = require('mdns');

mdns.Browser.defaultResolverSequence[1] = 'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]});

const browser = mdns.createBrowser('_http._tcp');

const devices = {};

browser.on('serviceUp', function(service) {
    const name = service.name || '';
    const host = service.host || '';
    const port = service.port || 80;
    const ip = (service.addresses || [])
        .filter(address => (typeof address === 'string') && address.split('.').length === 4)[0] || null;

    if(name.indexOf('myhomenew') === 0 && host && ip) {
        devices[name] = { host, ip, port };
    }
});

browser.on('serviceDown', function(service) {
    const name = service.name || '';
    if(name.indexOf('myhomenew') === 0) {
        devices[name] = undefined;
    }
});

browser.on('error', function(err) {
    console.log('err', err);
});

module.exports.startDiscovery = () => browser.start();
module.exports.stopDiscovery = () => browser.stop();
module.exports.getKnownDevices = () => _cloneDeep(devices);
