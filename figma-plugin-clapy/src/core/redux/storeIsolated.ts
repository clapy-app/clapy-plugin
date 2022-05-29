import { configureStore } from '@reduxjs/toolkit';
import type { AnyAction } from 'redux';

import type { RootState } from './store';

// The store resides in a separate file with nothing else to help prevent circular dependencies.
// Similarly, selectors have been moved out of slices. We could test later grouping them again to see if it causes
// any error.

// Wrapper to specify the type parameter of configureStore in below typing.
const csForType = (options: any) => configureStore<RootState, AnyAction, any>(options);
type Store = ReturnType<typeof csForType>;

let _store: Store | null = null;

export function setStore(store: Store) {
  _store = store;
}

export function getStore(): Store {
  if (!_store) {
    throw new Error(
      'Trying to read the store, e.g. to dispatch an action, but the store is not defined yet in storeIsolated.ts.' +
        ' Too early? This is not supposed to happen: to fix asap.',
    );
  }
  return _store;
}
