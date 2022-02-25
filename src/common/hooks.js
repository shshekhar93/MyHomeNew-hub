import { useCallback, useEffect, useState } from 'react';
import _groupBy from 'lodash/groupBy.js';
import QRCode from 'qrcode';
import {
  getExistingDevices,
  getCurrentUserDetails,
  logout,
  UNAUTHORIZED,
  getKnownDeviceList,
  createClientCreds,
  getAllAppConnections,
  getClient,
  fetchTranslations,
} from './api.js';
import { deviceMapper } from './mappers.js';
import { useStore } from './store.js';
import { useLocation } from 'react-router-dom';
import {
  AUTH_PAGE_OTHER_PARAMS,
  AUTH_PAGE_REQUIRED_PARAMS,
} from './constants.js';

function useLoadTranslations(store) {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const locale =
      query.get('locale') ||
      window.localStorage.getItem('locale') ||
      window.navigator.language ||
      window.navigator.userLanguage;

    (async () => {
      try {
        store.set('translations', await fetchTranslations(locale));
      } catch (e) {
        store.set('init-error', true);
      }
      store.set('translations-loaded', true);
    })();
  }, []);

  return useStoreUpdates(['translations'], store);
}

function useLoadUserDetails(store) {
  useEffect(() => {
    (async () => {
      try {
        store.set('user', await getCurrentUserDetails());
      } catch (e) {
        if (e !== UNAUTHORIZED) {
          store.set('init-error', true);
        }
      }
      store.set('user-loaded', true);
    })();
  }, []);

  return useStoreUpdates(['user'], store);
}

function useInitialized(store) {
  return useStoreUpdates(['user-loaded', 'translations-loaded'], store).every(
    Boolean
  );
}

function useUserDevices() {
  const store = useStore();

  const reloadDevices = useCallback(async () => {
    try {
      store.set('loading-devices', true);
      store.set('orig-devices', null);
      store.set('devices', null);
      const allDevices = await getExistingDevices();
      const mappedDevices = allDevices.flatMap(deviceMapper);
      const groupedDevices = _groupBy(mappedDevices, 'room');
      store.set('loading-devices', false);
      store.set('orig-devices', allDevices);
      store.set('devices', groupedDevices);
    } catch (e) {
      if (e !== UNAUTHORIZED) {
        store.set('user', null);
      }
    }
  }, []);

  const [loading, origDevices, devices] = useStoreUpdates(
    ['loading-devices', 'orig-devices', 'devices'],
    store,
    reloadDevices
  );

  return {
    loading,
    origDevices,
    devices,
    reloadDevices,
  };
}

function usePendingDevices() {
  const store = useStore();

  const reloadPendingDevices = async () => {
    store.set('loading-devices', true);
    const pendingDevices = await getKnownDeviceList();
    store.set('pending-devices', pendingDevices);
    store.set('loading-devices', false);
  };

  return useStoreUpdates(
    ['loading-devices', 'pending-devices'],
    store,
    reloadPendingDevices
  ).concat(reloadPendingDevices);
}

function useConnectApp() {
  const store = useStore();

  const getClientCreds = async () => {
    store.set('loading-credentials', true);
    const clientCreds = await createClientCreds({
      name: 'MyHome App',
      redirectUri: 'myhomenew://oauthreturn/',
    });

    store.set('clientId', clientCreds.id);
    store.set('clientSecret', clientCreds.secret);
    store.set(
      'QRCodeData',
      await QRCode.toDataURL(
        `${clientCreds.id}:${clientCreds.secret}:${window.location.protocol}//${window.location.host}`,
        { errorCorrectionLevel: 'H' }
      )
    );
    store.set('loading-credentials', false);
  };

  return useStoreUpdates(
    ['loading-credentials', 'clientId', 'clientSecret', 'QRCodeData'],
    store,
    getClientCreds
  );
}

function useClientConnections() {
  const store = useStore();

  const getExistingClients = async () => {
    store.set('loading-clietns', true);

    const formatter = new Intl.DateTimeFormat([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const clients = (await getAllAppConnections()).map((client) => ({
      ...client,
      createdDate: formatter.format(new Date(client.createdDate)),
    }));
    store.set('client-connections', clients);
    store.set('loading-clients', false);
  };

  return useStoreUpdates(
    ['loading-clients', 'client-connections'],
    store,
    getExistingClients
  ).concat(getExistingClients);
}

function useClientDetails() {
  const store = useStore();
  const { search } = useLocation();

  const getClientDetails = async () => {
    try {
      store.set('client-details-loading', true);

      /* Extract query params */
      const queryParams = new URLSearchParams(search);
      const query = {};
      for (const param of AUTH_PAGE_REQUIRED_PARAMS) {
        const val = queryParams.get(param);
        if (!val) {
          const err = new Error('Missing required param');
          err.code = `MISSING_${param.toUpperCase()}`;
          throw err;
        }
        query[param] = val;
      }

      for (const param of AUTH_PAGE_OTHER_PARAMS) {
        if (queryParams.has(param)) {
          query[param] = queryParams.get(param);
        }
      }
      store.set('client-params', query);

      /* Fetch client details */
      const { client } = await getClient(
        query.client_id,
        query.response_type,
        query.redirect_uri
      );
      if (!client) {
        throw new Error();
      }
      store.set('client-details', client);
    } catch (e) {
      store.set('client-details-error', e.code || 'Invalid client');
    } finally {
      store.set('client-details-loading', false);
    }
  };

  return useStoreUpdates(
    [
      'client-details-loading',
      'client-details-error',
      'client-details',
      'client-params',
    ],
    store,
    getClientDetails
  );
}

/**
 *
 * @param {Array<string>} keys - List of keys to subscribe to update for.
 * @param {Object} store - Store on which to subscribe.
 * @param {Function} initFn - Initializer function that will be called on mount.
 * @return {Array<any>} - Value of the keys in store.
 */
function useStoreUpdates(keys, store, initFn) {
  const [, rerender] = useState(0);

  if (!store) {
    store = useStore();
  }

  useEffect(() => {
    initFn && initFn();

    const handler = () => rerender(Date.now());
    keys.forEach((key) => store.subscribe(key, handler));
    return () => keys.forEach((key) => store.unsubscribe(key, handler));
  }, []);

  return keys.map((key) => store.get(key));
}

function useLogout() {
  const store = useStore();
  return async () => {
    await logout();
    store.set('user', null);
  };
}

export {
  useLoadTranslations,
  useLoadUserDetails,
  useInitialized,
  useUserDevices,
  useStoreUpdates,
  usePendingDevices,
  useConnectApp,
  useClientConnections,
  useClientDetails,
  useLogout,
};
