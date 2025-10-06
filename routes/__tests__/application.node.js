import setupAppRoutes from '../application';

describe('Applicatino routes tests', () => {
  const mockApp = {
    get: jest.fn(),
  };

  it('Should test all application routes setup', () => {
    setupAppRoutes(mockApp);
    expect(mockApp.get).toHaveBeenCalledWith(
      '/translations',
      expect.any(Function),
    );
  });
});
