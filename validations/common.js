import _get from 'lodash/get.js';

const exists = (item) => !item;
const gt = (limit) => (item) => item > limit;
const gte = (limit) => (item) => item >= limit;
const lt = (limit) => (item) => item < limit;
const lte = (limit) => (item) => item <= limit;

/**
 * Validates conformance of a provided object to a provided Schema.
 * 
 * @param {Array} schema - Schema to test the object with.
 * @param {Object} object - Object to run validation against.
 * 
 * @returns {boolean|string} - false if validations passed, errored field name otherwise
 */
const validate = (schema, object) => {
  return schema.some(([field, validator]) => {
    const value = _get(object, field);

    if(typeof validator === 'function') {
      return validator(value) && field;
    }

    // Composite schema.
    let result = false;
    if(Array.isArray(value)) {
      result = value.some((item, idx) => {
        const result = validate(item, validator);
        if(result) {
          return `[${idx}].${field}`;
        }
        return false;
      });
    }
    else {
      result = validate(value, validator);
    }
    
    if(result) {
      return `${field}.${result}`;
    }
    return false;
  });
}

export {
  exists,
  gt,
  gte,
  lt,
  lte,
  validate,
};
