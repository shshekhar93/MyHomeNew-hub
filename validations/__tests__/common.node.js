import { exists, gt, gte, lt, lte, validate } from '../common';

describe('Comparators tests', () => {
  // All comparators return true if condition fails,
  // this is somewhat confusing based on naming.

  it('Should check comparators', () => {
    // Exists
    expect(exists('val')).toBe(false);
    expect(exists(undefined)).toBe(true);

    // gt
    expect(gt(1)(2)).toBe(false);
    expect(gt(1)(1)).toBe(true);
    expect(gt(2)(1)).toBe(true);

    // gte
    expect(gte(1)(2)).toBe(false);
    expect(gte(1)(1)).toBe(false);
    expect(gte(2)(1)).toBe(true);

    // lt
    expect(lt(2)(1)).toBe(false);
    expect(lt(1)(1)).toBe(true);
    expect(lt(1)(2)).toBe(true);

    // lte
    expect(lte(2)(1)).toBe(false);
    expect(lte(1)(1)).toBe(false);
    expect(lte(1)(2)).toBe(true);
  });

  it('Should validate schema', () => {
    const simpleSchema = [['name', exists]];

    expect(validate(simpleSchema, { name: 'test-name' })).toBe(false);
    expect(validate(simpleSchema, {})).toBe(true);
  });

  it('Should validate array schema', () => {
    const arraySchema = [['users', [['name', exists]]]];

    expect(
      validate(arraySchema, {
        users: [{ name: 'user 1' }, { name: 'user 2' }],
      }),
    ).toBe(false);
    expect(
      validate(arraySchema, {
        users: [{ name: 'user 1' }, { id: 'user 2' }],
      }),
    ).toBe(true);
  });

  it('Should validate nested object schema', () => {
    const arraySchema = [['users', [['name', exists]]]];

    expect(
      validate(arraySchema, {
        users: { name: 'user 1' },
      }),
    ).toBe(false);
    expect(
      validate(arraySchema, {
        users: { id: 'user 2' },
      }),
    ).toBe(true);
  });
});
