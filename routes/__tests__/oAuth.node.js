import setupoAuthRoutes from '../oAuth';

describe('oAuth routes tests', () => {
  const mockApp = {
    get: jest.fn(),
    post: jest.fn(),
    oAuth: {
      authorize: jest.fn(() => () => {}),
      token: jest.fn(() => () => {}),
    },
  };
  const anyFn = expect.any(Function);

  it('Should setup oAuth routes', () => {
    setupoAuthRoutes(mockApp);

    expect(mockApp.post).toHaveBeenCalledWith('/authorize', anyFn, anyFn);
    expect(mockApp.post).toHaveBeenCalledWith('/token', anyFn);
    expect(mockApp.post).toHaveBeenCalledWith('/create-client', anyFn, anyFn);
    expect(mockApp.post).toHaveBeenCalledWith('/delete-client', anyFn, anyFn);
    expect(mockApp.get).toHaveBeenCalledWith('/existing-clients', anyFn, anyFn);
    expect(mockApp.get).toHaveBeenCalledWith('/client/:id', anyFn, anyFn);
  });
});
