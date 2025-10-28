export const EventTypes = {
  DEVICE_CONNECTION_STATUS: 'device-connection-status',
  DEVICE_STATE_CHANGE: 'device-state-change',
  SENSOR_DATA: 'sensor-data',
} as const;

export type ConnectionEventData = {
  deviceId: string;
  online: boolean;
};

export type ConnectionEventPayload = {
  eventType: typeof EventTypes.DEVICE_CONNECTION_STATUS;
  data: ConnectionEventData;
};

export type StateChangeEventData = {
  deviceId: string;
  interactionUnitId: number;
  newState: number;
};

export type SensorEventPayload = {
  eventType: typeof EventTypes.SENSOR_DATA;
  data: StateChangeEventData;
};

export type StateChangeEventPayload = {
  eventType: typeof EventTypes.DEVICE_STATE_CHANGE;
  data: StateChangeEventData;
};

export type EventTypesT = typeof EventTypes[keyof typeof EventTypes];
export type EventPayload
  = | ConnectionEventPayload
    | StateChangeEventPayload
    | SensorEventPayload;
