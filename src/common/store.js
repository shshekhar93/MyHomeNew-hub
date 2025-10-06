import { createContext, useContext } from 'react';
import _get from 'lodash/get.js';
import _set from 'lodash/set.js';

class Store {
  #dataStore;
  #eventHandlers;

  constructor() {
    this.#dataStore = Object.create(null);
    this.#eventHandlers = Object.create(null);
  }

  get(key) {
    return _get(this.#dataStore, key);
  }

  set(key, value) {
    _set(this.#dataStore, key, value);
    this.#fireEvents(key);
  }

  /**
   *
   * @param {string} key
   * @param {Function} handler
   */
  subscribe(key, handler) {
    key = pruneKey(key);
    if (this.#eventHandlers[key] === undefined) {
      this.#eventHandlers[key] = [];
    }
    this.#eventHandlers[key].push(handler);
  }

  unsubscribe(key, handler) {
    key = pruneKey(key);
    this.#eventHandlers[key] = (this.#eventHandlers[key] || []).filter(
      f => f !== handler,
    );
  }

  #fireEvents(key) {
    key = pruneKey(key);
    const value = this.get(key);
    const handlers = this.#eventHandlers[key] || [];
    handlers.forEach(f => setTimeout(() => f(value, key), 0));
  }
}

function pruneKey(key) {
  if (key.includes('.')) {
    return key.split('.')[0];
  }
  return key;
}

const StoreContext = createContext();
/**
 *
 * @return {Store} - returns store object.
 */
const useStore = () => {
  return useContext(StoreContext);
};

export default Store;
export { StoreContext, useStore };
