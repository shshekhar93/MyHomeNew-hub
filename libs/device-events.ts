import EventEmitter from 'node:events';
import { EventTypes, type ConnectionEventData, type EventPayload, type StateChangeEventData } from '../types/device-events.js';

const emitter = new EventEmitter();
export type EventHandler = (payload: EventPayload) => void;

emitter.on('error', () => {
  console.log('Unexpected error received on device events emitter..');
});

export const deviceConnectionStatus = (payload: ConnectionEventData) => {
  emitter.emit(EventTypes.DEVICE_CONNECTION_STATUS, payload);
};

export const deviceStateUpdate = (payload: StateChangeEventData) => {
  emitter.emit(EventTypes.DEVICE_STATE_CHANGE, payload);
};

export const reportSensorData = (payload: StateChangeEventData) => {
  emitter.emit(EventTypes.SENSOR_DATA, payload);
};

export const subscribe = (handler: EventHandler) => {
  const connectionStatusHandler = (data: ConnectionEventData) => {
    handler({
      eventType: EventTypes.DEVICE_CONNECTION_STATUS,
      data,
    });
  };
  emitter.on(EventTypes.DEVICE_CONNECTION_STATUS, connectionStatusHandler);

  const stateUpdateHandler = (data: StateChangeEventData) => {
    handler({
      eventType: EventTypes.DEVICE_STATE_CHANGE,
      data,
    });
  };
  emitter.on(EventTypes.DEVICE_STATE_CHANGE, stateUpdateHandler);

  const sensorDataHandler = (data: StateChangeEventData) => {
    handler({
      eventType: EventTypes.SENSOR_DATA,
      data,
    });
  };
  emitter.on(EventTypes.SENSOR_DATA, sensorDataHandler);

  return () => {
    emitter.off(EventTypes.DEVICE_CONNECTION_STATUS, connectionStatusHandler);
    emitter.off(EventTypes.DEVICE_STATE_CHANGE, stateUpdateHandler);
    emitter.off(EventTypes.SENSOR_DATA, sensorDataHandler);
  };
};
