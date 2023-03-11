jest.mock('./libs/logger.js', () => ({
  logger: jest.fn(),
  logInfo: jest.fn(),
  logError: jest.fn(),
  logMiddleware: jest.fn(),
}));
