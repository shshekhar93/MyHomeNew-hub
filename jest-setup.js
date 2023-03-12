// Mock logger to avoid unnecessary output on terminal
jest.mock('./libs/logger.js', () => ({
  logger: jest.fn(),
  logInfo: jest.fn(),
  logError: jest.fn(),
  logMiddleware: jest.fn(),
}));

// Mock nconf, since dynamic configuration is not expected in unit tests
jest.mock('nconf', () => {
  const nconf = {
    env: jest.fn(() => nconf),
    file: jest.fn(() => nconf),
    get: jest.fn(),
  };

  return nconf;
});
