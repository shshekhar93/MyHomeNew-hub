import { createContext, useContext } from 'react';
import _get from 'lodash/get';
import _set from 'lodash/set';

export type StoreSubscriptionHandler = (value: unknown, key: string) => void;

class Store {
  #dataStore;
  #eventHandlers: Record<string, StoreSubscriptionHandler[]>;

  constructor() {
    this.#dataStore = Object.create(null);
    this.#eventHandlers = Object.create(null);
  }

  get(key: string) {
    return _get(this.#dataStore, key);
  }

  set(key: string, value: unknown) {
    _set(this.#dataStore, key, value);
    this.#fireEvents(key);
  }

  /**
   *
   * @param {string} key
   * @param {Function} handler
   */
  subscribe(key: string, handler: StoreSubscriptionHandler) {
    key = pruneKey(key);
    if (this.#eventHandlers[key] === undefined) {
      this.#eventHandlers[key] = [];
    }
    this.#eventHandlers[key].push(handler);
  }

  unsubscribe(key: string, handler: StoreSubscriptionHandler) {
    key = pruneKey(key);
    this.#eventHandlers[key] = (this.#eventHandlers[key] || []).filter(
      f => f !== handler,
    );
  }

  #fireEvents(key: string) {
    key = pruneKey(key);
    const value = this.get(key);
    const handlers = this.#eventHandlers[key] || [];
    handlers.forEach(f => setTimeout(() => f(value, key), 0));
  }
}

function pruneKey(key: string) {
  if (key.includes('.')) {
    return key.split('.')[0];
  }
  return key;
}

const StoreContext = createContext<Store>(new Store());
/**
 *
 * @return {Store} - returns store object.
 */
const useStore = () => {
  return useContext(StoreContext);
};

export default Store;
export { StoreContext, useStore };
