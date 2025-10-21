import _get from 'lodash/get.js';

const exists = (item: unknown) => !item;
const gt = (limit: number) => (item: number) => item <= limit;
const gte = (limit: number) => (item: number) => item < limit;
const lt = (limit: number) => (item: number) => item >= limit;
const lte = (limit: number) => (item: number) => item > limit;

export type ValidatorFnT = (value: unknown) => boolean;
export type ValidationSchemaT = readonly [string, ValidatorFnT | readonly ValidationSchemaT[]];

/**
 * Validates conformance of a provided object to a provided Schema.
 *
 * @param {Array} schema - Schema to test the object with.
 * @param {Object} object - Object to run validation against.
 *
 * @return {boolean|string} - false if validations passed, errored field name otherwise
 */
const validate = (schema: readonly ValidationSchemaT[], object: Record<string, unknown>): boolean => {
  return schema.some(([field, validator]) => {
    const value = _get(object, field);

    if (typeof validator === 'function') {
      return validator(value) && field;
    }

    // Composite schema.
    let result = false;
    if (Array.isArray(value)) {
      result = value.some((item, idx) => {
        const result = validate(validator, item);
        if (result) {
          return `[${idx}].${result}`;
        }
        return false;
      });
    }
    else {
      result = validate(validator, value as Record<string, unknown>);
    }

    if (result) {
      return `${field}.${result}`;
    }
    return false;
  });
};

export { exists, gt, gte, lt, lte, validate };
