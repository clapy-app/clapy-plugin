import { configureStore, ThunkAction } from '@reduxjs/toolkit';
import { enableMapSet, setAutoFreeze } from 'immer';
import { AnyAction } from 'redux';

import { env } from '../../environment/env';
import { sampleApi } from '../../feat/api-sample';
import { authSlice } from '../../feat/auth/auth-slice';
import { importSlice } from '../../feat/import-sb/import-slice';
import { setStore } from './storeIsolated';

const reducer = {
  [authSlice.name]: authSlice.reducer,
  [sampleApi.reducerPath]: sampleApi.reducer,
  [importSlice.name]: importSlice.reducer,
};

// TODO bad practice, should refactor and re-enable after it works again.
setAutoFreeze(false);
enableMapSet();

// Don't import except in index.tsx.
export const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // TODO bad practice, should refactor and re-enable after it works again.
      // https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
      serializableCheck: false,
    }),
  devTools: env.isDev,
});

setStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;
