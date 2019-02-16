'use strict';
const _omit = require('lodash/omit');
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
