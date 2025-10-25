import type { UserT } from "./user.js";

export type DeviceT = {
  _id: string;
  name: string;
  label: string;
  user: string;
  room: string;
  hostname: string;
  port: number;
  isActive: boolean;
  leads: DeviceInteractionUnitT[];
};

export type DeviceInteractionUnitT = {
  devId: number;
  label: string;
  state: number;
  type: string;
  hasPwm: boolean;
  brightness: number;
};

export type PendingDeviceT = {
  name: string;
  type: string;
  user: string;
};

export type MappedDeviceT = Pick<DeviceT, 'name' | 'room' | 'isActive'>
  & Pick<DeviceInteractionUnitT, 'label' | 'state' | 'devId' | 'type'>;

export type DeviceAuthorizationT = {
  deviceId: string;
  role: string;
  user: UserT;
};