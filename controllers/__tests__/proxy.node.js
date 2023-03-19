import { spawn } from 'child_process';
import { generateExpressRequestMocks } from '../../test/test-utils';
import { proxyRequestsSetup } from '../proxy';
import UserModel from '../../models/users';

jest.mock('../../libs/esm-utils.js');
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));
jest.mock('../../models/users', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

const MOCK_OPTIONS = {
  email: 'foo@example.com',
};

const MOCK_USER = {
  _id: 'test-user-id',
};

describe('Proxy controller tests', () => {
  let exitHandler; let messageHandler; let middleware;
  const send = jest.fn();
  const childProcess = {
    on: (event, handler) => {
      if (event === 'exit') {
        exitHandler = handler;
      } else if (event === 'message') {
        messageHandler = handler;
      }
    },
    send,
  };

  beforeAll(() => {
    spawn.mockReturnValueOnce(childProcess);
    middleware = proxyRequestsSetup(MOCK_OPTIONS);

    expect(spawn).toHaveBeenCalled();
    expect(exitHandler).toStrictEqual(expect.any(Function));
    expect(messageHandler).toStrictEqual(expect.any(Function));
  });

  it('Should restart the process on exit', () => {
    spawn.mockClear();
    spawn.mockReturnValueOnce(childProcess);
    const oldExitHandler = exitHandler;
    const oldMessageHandler = messageHandler;
    exitHandler();
    // Should restart the process;
    expect(spawn).toHaveBeenCalled();
    expect(exitHandler).not.toBe(oldExitHandler);
    expect(messageHandler).not.toBe(oldMessageHandler);
  });

  it('Should send the options to client once it comes online', () => {
    // Test message handler
    messageHandler();
    expect(send).toHaveBeenCalledWith({
      ...MOCK_OPTIONS,
      cpSecret: expect.stringMatching(/[a-z0-9-]{36}/),
      localhost: 'http://localhost:8020',
    });
  });

  it('Should populate req.user for proxied requests', async () => {
    const [req, res, next] = generateExpressRequestMocks();
    send.mockClear();
    messageHandler();
    const cpSecret = send.mock.calls[0][0].cpSecret;
    req.get.mockReturnValueOnce(cpSecret);
    UserModel.findOne.mockResolvedValueOnce(MOCK_USER);
    await middleware(req, res, next);
    expect(UserModel.findOne).toHaveBeenCalledWith({
      email: MOCK_OPTIONS.email,
    });
    expect(next).toHaveBeenCalled();
  });

  it('Should propagate find user errors for proxied requests', async () => {
    const [req, res, next] = generateExpressRequestMocks();
    send.mockClear();
    messageHandler();
    const error = new Error('DB Unavailable');
    const cpSecret = send.mock.calls[0][0].cpSecret;
    req.get.mockReturnValueOnce(cpSecret);
    UserModel.findOne.mockRejectedValueOnce(error);
    await middleware(req, res, next);
    expect(UserModel.findOne).toHaveBeenCalledWith({
      email: MOCK_OPTIONS.email,
    });
    expect(next).toHaveBeenCalledWith(error);
  });

  it('Should ignore requests with no req secrets', async () => {
    const [req, res, next] = generateExpressRequestMocks();
    req.get.mockReturnValueOnce(null);
    await middleware(req, res, next);
    expect(UserModel.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('Should ignore requests with wrong req secrets', async () => {
    const [req, res, next] = generateExpressRequestMocks();
    req.get.mockReturnValueOnce('foobar');
    await middleware(req, res, next);
    expect(UserModel.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
