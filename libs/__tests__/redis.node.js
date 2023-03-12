import { createClient } from 'redis';
import { connect } from '../redis';

jest.mock('redis', () => {
  const mockClient = {
    handlers: {},
    on: function (event, handler) {
      if (!this.handlers[event]) {
        this.handlers[event] = [];
      }
      this.handlers[event].push(handler);
    },
    once: function (...args) {
      this.on(...args);
    },
    connect: jest.fn(),
  };

  return {
    createClient: () => mockClient,
  };
});

describe('Redis -- connect tests', () => {
  const mockClient = createClient();

  it('Should connect to redis', async () => {
    mockClient.connect.mockImplementation(async () => {
      mockClient.handlers.ready[0]();
    });

    await expect(connect()).resolves.toBe(undefined);
  });

  it('Should handle connect failures', async () => {
    const redisError = new Error('a redis error');
    mockClient.connect.mockImplementation(() => Promise.reject(redisError));
    await expect(connect).rejects.toThrow(redisError);
  });

  it('Should handle error event', async () => {
    mockClient.handlers.error[0](new Error('a redis error'));
  });

  it('Should handle end event', async () => {
    mockClient.handlers.end[0]();
  });
});
