import { DeviceAuthorizationModel } from '../models/device-authorizations.js';
import DeviceModel, { type DeviceModelT } from '../models/devices.js';
import UserModel, { type UserT } from '../models/users.js';

export type IsUserAuthorizedForDeviceParamsT = (
  | { deviceId: string; deviceName?: never }
  | { deviceId?: never; deviceName: string }
) & (
  | { userId: string; userEmail?: never }
  | { userId?: never; userEmail: string }
  );

export enum UserAuthorizationType {
  OWNER = 'owner',
  AUTHORIZED_USER = 'authorized_user',
  UNKNOWN_DEVICE = 'unknown_device',
  UNAUTHORIZED = 'unauthorized',
};

export type IsUserAuthorizedForDeviceReturnT = {
  authorized: boolean;
  authorizationType: UserAuthorizationType;
  device: DeviceModelT | null;
  user: UserT | null;
};

export async function isUserAuthorizedForDevice({
  userId = '',
  userEmail = '',
  deviceId,
  deviceName,
}: IsUserAuthorizedForDeviceParamsT): Promise<IsUserAuthorizedForDeviceReturnT> {
  if ((!deviceId && !deviceName) || (!userId && !userEmail)) {
    return {
      authorized: false,
      authorizationType: UserAuthorizationType.UNKNOWN_DEVICE,
      user: null,
      device: null,
    };
  }

  const device = await DeviceModel.findOne(
    deviceId ? { _id: deviceId } : { name: deviceName },
  ).lean();

  if (!device) {
    return {
      authorized: false,
      authorizationType: UserAuthorizationType.UNKNOWN_DEVICE,
      user: null,
      device: null,
    };
  }

  const user = await UserModel.findOne(userId ? { _id: userId } : { email: userEmail }).lean();
  if (!user) {
    return {
      authorized: false,
      authorizationType: UserAuthorizationType.UNAUTHORIZED,
      device: device,
      user: null,
    };
  }

  // Check if the user is the owner of the device
  if (device.user === user.email) {
    return {
      authorized: true,
      authorizationType: UserAuthorizationType.OWNER,
      user,
      device,
    };
  }

  // Check if the user has an authorization entry for the device
  const authorization = await DeviceAuthorizationModel.findOne({
    deviceId: device._id,
    userId: user._id,
  }).lean();

  return {
    authorized: !!authorization,
    authorizationType: authorization ? UserAuthorizationType.AUTHORIZED_USER : UserAuthorizationType.UNAUTHORIZED,
    user,
    device,
  };
}
