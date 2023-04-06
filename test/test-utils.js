export function generateExpressRequestMocks() {
  const req = {
    body: {},
    query: {},
    login: jest.fn(),
    get: jest.fn(),
  };

  Object.defineProperty(req, 'login', {
    writable: false,
    configurable: false,
  });

  const res = {
    setHeader: jest.fn(console.log),
    status: jest.fn(() => res),
    type: jest.fn(() => res),
    json: jest.fn(),
    sendFile: jest.fn(),
    end: jest.fn(),
  };
  const next = jest.fn();

  return [req, res, next];
}

export function injectLean(fn) {
  if (typeof fn !== 'function') {
    fn.lean = function () {
      return this;
    };
    return fn;
  }

  return function (...args) {
    const aPromise = fn(...args);
    aPromise.lean = function () {
      return this;
    };
    return aPromise;
  };
}
