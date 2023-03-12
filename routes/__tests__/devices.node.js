import { isDevOnline, proxy } from '../../controllers/ws/server';
import { generateExpressRequestMocks } from '../../test/test-utils';
import setupDevicesRoutes from '../devices';

jest.mock('../../controllers/ws/server', () => ({
  isDevOnline: jest.fn(),
  proxy: jest.fn(),
}));

describe('Device routes tests', () => {
  const mockApp = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    use: jest.fn(),
  };
  const anyFn = expect.any(Function);

  let proxyMiddleware;

  beforeAll(() => {
    setupDevicesRoutes(mockApp);

    expect(mockApp.get).toHaveBeenCalledWith(
      '/devices/available',
      anyFn,
      anyFn
    );
    expect(mockApp.get).toHaveBeenCalledWith('/devices', anyFn, anyFn);
    expect(mockApp.get).toHaveBeenCalledWith('/devices/:name', anyFn, anyFn);
    expect(mockApp.get).toHaveBeenCalledWith(
      '/v1/:name/get-firmware/:id',
      anyFn
    );
    expect(mockApp.post).toHaveBeenCalledWith('/devices', anyFn, anyFn);
    expect(mockApp.post).toHaveBeenCalledWith('/devices/new', anyFn, anyFn);
    expect(mockApp.post).toHaveBeenCalledWith('/devices/:name', anyFn, anyFn);
    expect(mockApp.post).toHaveBeenCalledWith(
      '/devices/:name/update-firmware',
      anyFn,
      anyFn
    );
    expect(mockApp.put).toHaveBeenCalledWith('/devices/:name', anyFn, anyFn);
    expect(mockApp.use).toHaveBeenCalledWith('/devices', anyFn, anyFn);

    proxyMiddleware = mockApp.use.mock.calls[0][2];
  });

  it('Should proxy request', () => {
    const [req, res, next] = generateExpressRequestMocks();
    req.user = { hubClientId: 'test' };
    isDevOnline.mockReturnValueOnce(true);

    proxyMiddleware(req, res, next);
    expect(proxy).toHaveBeenCalledWith(req, res);
  });

  it('Should not proxy if user does not have a client id', () => {
    const [req, res, next] = generateExpressRequestMocks();
    req.user = { hubClientId: null };

    proxyMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('Should not proxy if dev is not online', () => {
    const [req, res, next] = generateExpressRequestMocks();
    req.user = { hubClientId: 'test' };
    isDevOnline.mockReturnValueOnce(false);

    proxyMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(isDevOnline).toHaveBeenCalled();
  });
});
