import { useEffect, useState } from "react";
import { getCurrentUserDetails, logout, UNAUTHORIZED } from "./api.js";
import { useStore } from "./store.js";

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

function hookStoreUpdates(keys, store) {
  const [, rerender] = useState(0);

  if(!store) {
    store = useStore();
  }

  useEffect(() => {
    const handler = (value, key) => {
      rerender(Date.now())
    };
    keys.forEach(key => store.subscribe(key, handler));

    return () => keys.forEach(key => store.unsubscribe(key, handler));
  }, []);
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
  hookStoreUpdates,
  useLogout,
};
