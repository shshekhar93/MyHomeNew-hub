import { generateExpressRequestMocks, injectLean } from '../../test/test-utils';
import {
  getAvailableDevices,
  queryDevice,
  saveNewDeviceForUser,
} from '../devices';
import DeviceSetupModel from '../../models/device-setup.js';
import DeviceModel from '../../models/devices';
import { requestToDevice } from '../ws/server';

jest.mock('../ws/server.js');
jest.mock('../../models/device-setup.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  },
}));
jest.mock('../../models/devices', () => ({
  create: jest.fn(),
  find: jest.fn(),
}));

const MOCK_PENDING_DEVICES = [
  {
    _id: 'dev-id-1',
    name: 'dev1',
    encryptionKey: '12345678901234567890123456789012',
  },
  {
    _id: 'dev-id-2',
    name: 'dev2',
    encryptionKey: '09876543210987654321098765432109',
  },
];

const MOCK_DEVICES = [
  {
    _id: 'dev-id-1',
    name: 'dev1',
    encryptionKey: '12345678901234567890123456789012',
    leads: [
      {
        devId: 0,
        label: 'switch1',
        state: '100',
      },
      {
        devId: 1,
        label: 'switch2',
        state: '0',
      },
    ],
  },
  {
    _id: 'dev-id-2',
    name: 'dev2',
    encryptionKey: '09876543210987654321098765432109',
  },
];

describe('Devices Controller tests', () => {
  describe('getAvailableDevices tests', () => {
    it('Should return all pending devices', async () => {
      const [req, res] = generateExpressRequestMocks();
      req.user = { _id: 'user-id' };
      DeviceSetupModel.find.mockReturnValueOnce(
        injectLean(Promise.resolve(MOCK_PENDING_DEVICES))
      );

      await getAvailableDevices(req, res);
      expect(DeviceSetupModel.find).toHaveBeenCalledWith({
        user: req.user._id,
      });
      expect(res.json).toHaveBeenCalledWith({
        dev1: MOCK_PENDING_DEVICES[0],
        dev2: MOCK_PENDING_DEVICES[1],
      });
    });
  });

  describe('saveNewDeviceForUser tests', () => {
    it('Should fail if there is no pending device', async () => {
      const [req, res] = generateExpressRequestMocks();
      req.user = { _id: 'user-id' };
      req.body = { name: 'dev1' };
      DeviceSetupModel.findOne.mockReturnValueOnce(Promise.resolve(null));

      await saveNewDeviceForUser(req, res);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        err: 'Device not available to setup',
      });
    });

    it('Should confirm a pending device', async () => {
      const [req, res] = generateExpressRequestMocks();
      req.user = { _id: 'user-id', email: 'test@example.com' };
      req.body = { name: 'dev1', description: 'dev1 description' };
      DeviceSetupModel.findOne.mockReturnValueOnce(
        Promise.resolve(MOCK_PENDING_DEVICES[0])
      );

      await saveNewDeviceForUser(req, res);
      expect(DeviceSetupModel.findOne).toHaveBeenCalledWith({
        user: req.user._id,
        name: req.body.name,
      });
      expect(DeviceModel.create).toHaveBeenCalledWith({
        ...req.body,
        user: req.user.email,
        encryptionKey: MOCK_PENDING_DEVICES[0].encryptionKey,
      });
      expect(DeviceSetupModel.deleteOne).toHaveBeenCalledWith({
        _id: MOCK_PENDING_DEVICES[0]._id,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('queryDevice tests', () => {
    it('Should return device state', async () => {
      const [req, res] = generateExpressRequestMocks();
      req.params = { name: 'dev1' };
      DeviceModel.find.mockReturnValueOnce(
        injectLean(Promise.resolve(MOCK_DEVICES[0]))
      );
      requestToDevice.mockReturnValueOnce({
        lead0: 50,
        lead1: 78,
      });

      await queryDevice(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'dev1',
          isActive: true,
          leads: [
            expect.objectContaining({ devId: 0, brightness: 50 }),
            expect.objectContaining({ devId: 1, brightness: 78 }),
          ],
        })
      );
    });
  });
});
