import { readFile } from 'fs/promises';
import { getFileURL } from '../../libs/esm-utils';
import DeviceModel from '../../models/devices';
import { generateExpressRequestMocks, injectLean } from '../../test/test-utils';
import firmwareController from '../firmware';

jest.mock('../../libs/esm-utils');
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));
jest.mock('../../models/devices', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

const MOCK_DEVICE = {
  encryptionKey: '12345678901234567890123456789012',
};

describe('Firmware controller tests', () => {
  it('Should return error if no encryption key in device model', async () => {
    const [req, res] = generateExpressRequestMocks();
    DeviceModel.findOne.mockReturnValueOnce(injectLean(Promise.resolve({})));
    req.params = { name: 'test-device-name' };
    await firmwareController(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'DEV_NOT_FOUND',
    });
  });

  it('Should return error if no device found', async () => {
    const [req, res] = generateExpressRequestMocks();
    DeviceModel.findOne.mockReturnValueOnce(injectLean(Promise.resolve(null)));
    req.params = { name: 'test-device-name' };
    await firmwareController(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'DEV_NOT_FOUND',
    });
  });

  it('Should return error if invalid file', async () => {
    const [req, res] = generateExpressRequestMocks();
    DeviceModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(MOCK_DEVICE)),
    );

    // Invalid file but valid frame num
    req.params = {
      name: 'test-device-name',
      id: '460512e07bdb179dba30bb1fc299de50-c981',
    };
    await firmwareController(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'INVALID_ID_IN_REQ',
    });
  });

  it('Should return error if valid file but invalid frame number', async () => {
    const [req, res] = generateExpressRequestMocks();
    DeviceModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(MOCK_DEVICE)),
    );

    // Valid file but invalid frame num
    req.params = {
      name: 'test-device-name',
      id: 'c013f8b927a016ea364240be2f3de934-4f6443565fe9f7146886ada45adcbe060bf6',
    };
    await firmwareController(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'INVALID_ID_IN_REQ',
    });
  });

  it('Should respond with firmware', async () => {
    const firmwareBuffer = Buffer.from('This is firmware');
    const [req, res] = generateExpressRequestMocks();
    DeviceModel.findOne.mockReturnValueOnce(
      injectLean(Promise.resolve(MOCK_DEVICE)),
    );
    getFileURL.mockReturnValueOnce('/path/to/file');
    readFile.mockReturnValueOnce(firmwareBuffer);

    // Valid file and valid frame num
    req.params = {
      name: 'test-device-name',
      id: '61df3f97b90525f848f67ff193066839-c3198d2f5b16822de92c0a2537c869',
    };
    await firmwareController(req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename=firmware.bin',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/octet-stream',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Length',
      firmwareBuffer.length,
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-MD5',
      '75d212b1b5a2d1c19167fedc102e6257',
    );
    expect(res.end).toHaveBeenCalledWith(firmwareBuffer);
  });
});
