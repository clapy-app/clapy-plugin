import { AnyAction } from '@reduxjs/toolkit';
import type { Selector } from 'reselect';

import { RootState } from './store';
import { getStore } from './storeIsolated';

export function readSelectorOnce<T>(selector: Selector<RootState, T>): T {
  const state = getStore().getState();
  return selector(state);
}

/**
 * Dispatcher to use in a context that has no dedicated dispatcher, i.e. the store is unknown.
 * Example: use it in a utility function.
 * Don't use: in component or hook (use `useAppDispatch` instead) or in a thunk (the state should be accessible there)
 */
export function dispatchOther(action: AnyAction) {
  getStore().dispatch(action);
}
