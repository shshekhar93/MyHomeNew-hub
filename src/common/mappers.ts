import { DeviceT } from '../../types/device';

function deviceMapper(serviceDevice: DeviceT) {
  const { name, room, leads, isActive } = serviceDevice;
  return leads.map(({ label, state, devId, type }) => ({
    name,
    devId,
    label,
    room,
    state,
    type,
    isActive,
  }));
}

export { deviceMapper };
