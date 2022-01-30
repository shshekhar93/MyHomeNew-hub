'use strict';

export const UNAUTHORIZED = new Error('UNAUTHORIZED');
export const SERVER_ERROR = new Error('SERVER_ERROR');

const PAYLOAD_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
const NO_PAYLOAD_METHODS = [ 'GET' ];

const makeHTTPRequest = async (method, url, body = {}, headers = {}) => {
  const sendPayload = !NO_PAYLOAD_METHODS.includes(method);
  const resp = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(sendPayload? PAYLOAD_HEADERS : {}),
      ...headers
    },
    body: sendPayload? JSON.stringify(body) : undefined,
  });

  if(resp.ok) {
    return resp.json();
  }

  if(resp.status === 401) {
    throw UNAUTHORIZED;
  }

  throw SERVER_ERROR;
}

const makeGetRequest = makeHTTPRequest.bind(null, 'GET');
const makePostRequest = makeHTTPRequest.bind(null, 'POST');

export const login = (username, password) => {
  return makePostRequest('/login', {
    username,
    password
  });
};

export const logout = () => {
  return makeGetRequest('/logout');
};

export const getCurrentUserDetails = () => {
  return makeGetRequest('/user/@me');
};

export const getExistingDevices = () => {
  return makeGetRequest('/devices');
};

export const getKnownDeviceList = () => {
  return makeGetRequest('/devices/available');
};

export const saveDeviceForUser = (body) => {
  return makePostRequest('/devices', body);
};

export const updateDeviceState = (device, switchId, newState) => {
  return makePostRequest(`/devices/${device}`, {
    switchId,
    newState
  });
};

export const updateDevice = (device) => {
  const { name } = device;
  return makePostRequest(`/devices/${name}`, device);
};

export function registerUser (user) {
  return makePostRequest('/user/register', user);
}

export function generateOTK() {
  return makePostRequest('/devices/new');
}

export function createClientCreds(req) {
  return makePostRequest('/create-client', req);
}

export function getAllAppConnections() {
  return makeGetRequest('/existing-clients');
}

export function deleteAppConnection(id) {
  return makePostRequest('/delete-client', { id });
}
