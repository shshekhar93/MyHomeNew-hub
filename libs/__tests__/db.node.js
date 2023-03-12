import { connect as mongooseConnect } from 'mongoose';
import nconf from 'nconf';
import { connect } from '../db';

const TEST_CONN_STR = 'mongodb://host/db';

jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

describe('DB library tests', () => {
  it('Should attempt to connect to db', async () => {
    nconf.get.mockReturnValueOnce(TEST_CONN_STR);
    mongooseConnect.mockReturnValueOnce(Promise.resolve());

    await connect();
    expect(mongooseConnect).toHaveBeenCalledTimes(1);
    expect(mongooseConnect).toHaveBeenCalledWith(TEST_CONN_STR, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      autoIndex: false,
    });
  });

  it('Should re-attempt to connect to db if first one fails', async () => {
    nconf.get.mockReturnValueOnce(TEST_CONN_STR);
    const error = new Error('Host not available');
    mongooseConnect.mockReturnValueOnce(Promise.reject(error));
    mongooseConnect.mockReturnValueOnce(Promise.resolve());
    await connect();

    expect(mongooseConnect).toHaveBeenCalledTimes(2);
  });

  it('Should only attempt to connect to db twice', async () => {
    nconf.get.mockReturnValueOnce(TEST_CONN_STR);
    const error = new Error('Host not available');
    mongooseConnect.mockReturnValueOnce(Promise.reject(error));
    mongooseConnect.mockReturnValueOnce(Promise.reject(error));

    await connect();
    expect(mongooseConnect).toHaveBeenCalledTimes(2);
  });
});
