import { useCallback, useEffect, useState } from "react";
import _groupBy from 'lodash/groupBy.js';

import { getExistingDevices, getCurrentUserDetails, logout, UNAUTHORIZED } from "./api.js";
import { deviceMapper } from "./mappers.js";
import Store, { useStore } from "./store.js";

function hookUserDetails(store) {
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

function hookUserDevices() {
  const store = useStore();
  const [, rerender] = useState(0);

  const reloadDevices = useCallback(async () => {
    try {
      const allDevices = (await getExistingDevices())
        .flatMap(deviceMapper);
      const groupedDevices = _groupBy(allDevices, 'room');
      store.set('devices', groupedDevices);
    } catch(e) {
      if(e !== UNAUTHORIZED) {
        store.set('user', null);
      }
    }
  }, []);

  useEffect(() => {
    reloadDevices();
    const handler = () => rerender(Date.now());
    store.subscribe('devices', handler);
    return () => store.unsubscribe('devices', handler);
  }, []);

  const devices = store.get('devices');
  return {
    devices,
    reloadDevices
  };
}

/**
 * 
 * @param {Array<string>} keys - List of keys to subscribe to update for.
 * @param {Store} store - Store on which to subscribe.
 * @returns {Array<any>} - Value of the keys in store.
 */
function hookStoreUpdates(keys, store) {
  const [, rerender] = useState(0);

  if(!store) {
    store = useStore();
  }

  useEffect(() => {
    const handler = () => {
      rerender(Date.now())
    };
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
  hookUserDetails,
  hookUserDevices,
  hookStoreUpdates,
  useLogout,
};
