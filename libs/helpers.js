'use strict';
import _omit from 'lodash/omit.js';
import { logError } from './logger.js';

const IGNORED_KEYS = ['__v'];
export const schemaTransformer = (doc, ret) => {
  return _omit(ret, IGNORED_KEYS);
};

export const transformer = {
  toObject: {
    transform: schemaTransformer,
  },
  toJSON: {
    transform: schemaTransformer,
  },
};

export const resp = (success, obj = {}) => ({
  success,
  ...obj,
});

export const errResp = resp.bind(null, false);
export const successResp = resp.bind(null, true);

/**
 *
 * @param {Function} middleware - A promise returning middleware
 * @return {undefined}
 */
export const catchAndRespond = (middleware) => {
  return async (req, res, next) => {
    try {
      middleware(req, res, next);
    } catch (e) {
      logError(e);
      res.status(500).json(
        errResp({
          err: e.message || e,
        })
      );
    }
  };
};
