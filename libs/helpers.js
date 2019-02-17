'use strict';
const _omit = require('lodash/omit');
const Bluebird = require('bluebird');
const request = Bluebird.promisify(require('request'));
const DNS = require('dns');
const lookup = Bluebird.promisify(DNS.lookup, {context: DNS});

const IGNORED_KEYS = ['_id', '__v'];
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
    return lookup(`${devName}.local`, { family: 4 })
        .then(ip => request(`http://${ip}:${devPort}${url}`))
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
