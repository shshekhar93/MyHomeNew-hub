import { useCallback, useEffect, useState } from "react";
import _groupBy from 'lodash/groupBy.js';

import { getExistingDevices, getCurrentUserDetails, logout, UNAUTHORIZED, getKnownDeviceList } from "./api.js";
import { deviceMapper } from "./mappers.js";
import Store, { useStore } from "./store.js";

function useUserDetails(store) {
  const [, rerender] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        store.set('user', await getCurrentUserDetails());
      } catch(e) {
        if(e !== UNAUTHORIZED) {
          store.set('initError', true);
        }
      }
      store.set('initialized', true);
    })();

    const handler = () => rerender(Date.now());
    store.subscribe('user', handler);
    return () => store.unsubscribe('user', handler);
  }, []);
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
    } catch(e) {
      if(e !== UNAUTHORIZED) {
        store.set('user', null);
      }
    }
  }, []);

  const [
    loading,
    origDevices,
    devices
  ] = useStoreUpdates([
    'loading-devices',
    'orig-devices',
    'devices'
  ], store, reloadDevices);

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

  return useStoreUpdates([
    'loading-devices',
    'pending-devices'
  ], store, reloadPendingDevices)
    .concat(reloadPendingDevices);
}

/**
 * 
 * @param {Array<string>} keys - List of keys to subscribe to update for.
 * @param {Store} store - Store on which to subscribe.
 * @param {Function} initFn - Initializer function that will be called on mount.
 * @returns {Array<any>} - Value of the keys in store.
 */
function useStoreUpdates(keys, store, initFn) {
  const [, rerender] = useState(0);

  if(!store) {
    store = useStore();
  }

  useEffect(() => {
    initFn && initFn();

    const handler = () => rerender(Date.now());
    keys.forEach(key => store.subscribe(key, handler));
    return () => keys.forEach(key => store.unsubscribe(key, handler));
  }, []);

  return keys.map(key => store.get(key));
}

function useLogout() {
  const store = useStore();
  return async () => {
    await logout();
    store.set('user', null);
  }
}

export {
  useUserDetails,
  useUserDevices,
  useStoreUpdates,
  usePendingDevices,
  useLogout,
};
