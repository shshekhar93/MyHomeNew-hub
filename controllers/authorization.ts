import { DeviceAuthorizationModel } from "../models/device-authorizations.js";
import DeviceModel from "../models/devices.js";
import UserModel, { type UserT } from "../models/users.js";

export type IsUserAuthorizedForDeviceParamsT = {
  deviceId: string;
} & (
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
  user: UserT | null;
};

export async function isUserAuthorizedForDevice({
  userId = '',
  userEmail = '',
  deviceId
}: IsUserAuthorizedForDeviceParamsT): Promise<IsUserAuthorizedForDeviceReturnT> {
  if (!deviceId || (!userId && !userEmail)) {
    return {
      authorized: false,
      authorizationType: UserAuthorizationType.UNKNOWN_DEVICE,
      user: null,
    };
  }
  const device = await DeviceModel.findById(deviceId).lean();

  if (!device) {
    return {
      authorized: false,
      authorizationType: UserAuthorizationType.UNKNOWN_DEVICE,
      user: null,
    };
  }

  const user = await UserModel.findOne(userId ? { _id: userId } : { email: userEmail }).lean();
  if (!user) {
    return {
      authorized: false,
      authorizationType: UserAuthorizationType.UNAUTHORIZED,
      user: null,
    };
  }

  // Check if the user is the owner of the device
  if (device.user === user.email) {
    return {
      authorized: true,
      authorizationType: UserAuthorizationType.OWNER,
      user,
    };
  }

  // Check if the user has an authorization entry for the device
  const authorization = await DeviceAuthorizationModel.findOne({
    deviceId,
    userId: user._id,
  }).lean();

  return {
    authorized: !!authorization,
    authorizationType: authorization ? UserAuthorizationType.AUTHORIZED_USER : UserAuthorizationType.UNAUTHORIZED,
    user,
  };
}