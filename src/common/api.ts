'use strict';

import type { OAuthClient } from '../../types/client';
import type { DeviceT, PendingDeviceT } from '../../types/device';

export const UNAUTHORIZED = new Error('UNAUTHORIZED');
export const SERVER_ERROR = new Error('SERVER_ERROR');

const PAYLOAD_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};
const NO_PAYLOAD_METHODS = ['GET'];

const makeHTTPRequest = async <T = unknown>(method: string, url: string, body: unknown = {}, headers: Record<string, string> = {}): Promise<T> => {
  const sendPayload = !NO_PAYLOAD_METHODS.includes(method);
  const resp = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(sendPayload ? PAYLOAD_HEADERS : {}),
      ...headers,
    },
    body: sendPayload ? JSON.stringify(body) : undefined,
  });

  if (resp.ok) {
    return resp.json();
  }

  if (resp.status === 401) {
    throw UNAUTHORIZED;
  }

  throw SERVER_ERROR;
};

const makeGetRequest = <T>(url: string, body?: unknown, headers?: Record<string, string>) => makeHTTPRequest<T>('GET', url, body, headers);
const makePostRequest = <T>(url: string, body?: unknown, headers?: Record<string, string>) => makeHTTPRequest<T>('POST', url, body, headers);

export const login = (username: string, password: string) => {
  return makePostRequest('/login', {
    username,
    password,
  });
};

export const logout = () => {
  return makeGetRequest('/logout');
};

export const fetchTranslations = (locale: string) => {
  return makeGetRequest(`/translations?locale=${locale}`);
};

export const getCurrentUserDetails = () => {
  return makeGetRequest('/user/@me');
};

export const getExistingDevices = () => {
  return makeGetRequest<DeviceT[]>('/devices');
};

export const getKnownDeviceList = () => {
  return makeGetRequest<PendingDeviceT[]>('/devices/available');
};

export const saveDeviceForUser = (body: unknown) => {
  return makePostRequest('/devices', body);
};

export const updateDeviceState = (device: string, switchId: number, newState: number) => {
  return makePostRequest(`/devices/${device}`, {
    switchId,
    newState,
  });
};

export const updateDevice = (device: DeviceT) => {
  const { name } = device;
  return makeHTTPRequest('PUT', `/devices/${name}`, device);
};

export function registerUser(user: unknown) {
  return makePostRequest<{
    hubClientId: string;
    hubClientSecret: string;
  }>('/user/register', user);
}

export function generateOTK() {
  return makePostRequest<{ otk: string }>('/devices/new');
}

export function createClientCreds(req: unknown) {
  return makePostRequest<OAuthClient>('/create-client', req);
}

export function getAllAppConnections() {
  return makeGetRequest<OAuthClient[]>('/existing-clients');
}

export function deleteAppConnection(id: string) {
  return makePostRequest('/delete-client', { id });
}

/**
 *
 * @param {string} id Client id of the oauth client to fetch
 * @param {string} responseType Response type requested by the client.
 * @param {string} redirectUri Redirect URI provided by client.
 * @return {Object}
 */
export function getClient(id: string, responseType: string, redirectUri: string) {
  responseType = encodeURIComponent(responseType);
  redirectUri = encodeURIComponent(redirectUri);
  return makeGetRequest<{ client: OAuthClient }>(
    `/client/${id}?responseType=${responseType}&redirectUri=${redirectUri}`,
  );
}
