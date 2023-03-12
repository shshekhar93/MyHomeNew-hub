export function generateExpressRequestMocks() {
  const req = {
    body: {},
    query: {},
    login: jest.fn(),
  };

  Object.defineProperty(req, 'login', {
    writable: false,
    configurable: false,
  });

  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };
  const next = jest.fn();

  return [req, res, next];
}
