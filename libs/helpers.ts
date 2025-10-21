'use strict';
import _omit from 'lodash/omit.js';
import { logError } from './logger.js';
import type { Request, Response } from 'express';

const IGNORED_KEYS = ['__v'];
export const schemaTransformer = <T extends object | null | undefined>(_: unknown, ret: T): Omit<T, '__v'> => {
  return _omit(ret, IGNORED_KEYS) as Omit<T, '__v'>;
};

export const transformer = {
  toObject: {
    transform: schemaTransformer,
  },
  toJSON: {
    transform: schemaTransformer,
  },
};

export const resp = (success: boolean, obj: Record<string, unknown> = {}) => ({
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
export const catchAndRespond = (middleware: (req: Request, res: Response, next: (err?: Error) => void) => void) => {
  return async (req: Request, res: Response, next: (err?: Error) => void) => {
    try {
      await middleware(req, res, next);
    }
    catch (e) {
      logError(e);
      res.status(500).json(
        errResp({
          err: (e as Error)?.message || e,
        }),
      );
    }
  };
};

export const getCurrentUser = (req: Request, res: Response) => {
  return res?.locals?.oauth?.token?.user ?? req?.user;
};

export const isValidDeviceName = (str: string) => {
  return str.startsWith('myhomenew-') || str.startsWith('homeapplyed-');
};
