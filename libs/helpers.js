'use strict';
import _omit from 'lodash/omit.js';

const IGNORED_KEYS = ['__v'];
export const schemaTransformer = (doc, ret) => {
  return _omit(ret, IGNORED_KEYS);
};

export const transformer = {
  toObject: {
      transform: schemaTransformer
  },
  toJSON: {
    transform: schemaTransformer
  }
};

export const resp = (success, obj = {}) => ({
  success,
  ...obj
});

export const errResp = resp.bind(null, false);
export const successResp = resp.bind(null, true);
