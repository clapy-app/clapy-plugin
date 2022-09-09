import type { AnyAction, Selector } from '@reduxjs/toolkit';
import { useRef } from 'react';

import type { RootState } from './store';
import { getStore } from './storeIsolated';

export function readSelectorOnce<T>(selector: Selector<RootState, T>): T {
  const state = getStore().getState();
  return selector(state);
}

export function useSelectorOnce<T>(selector: Selector<RootState, T>): T {
  const initialValueRef = useRef(readSelectorOnce(selector));
  return initialValueRef.current;
}

/**
 * Dispatcher to use in a context that has no dedicated dispatcher, i.e. the store is unknown.
 * Example: use it in a utility function.
 * Don't use: in component or hook (use `useAppDispatch` instead) or in a thunk (the state should be accessible there)
 */
export function dispatchOther(action: AnyAction) {
  getStore().dispatch(action);
}
