import type { AnyAction, ThunkAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet, setAutoFreeze } from 'immer';

import { env } from '../../environment/env';
import { importSlice } from '../../pages/1-import-sb/import-slice';
import { exportCodeSlice } from '../../pages/2-export-code/export-code-slice.js';
import { githubSlice } from '../../pages/2-export-code/github/github-slice.js';
import { stripeSlice } from '../../pages/3-Account/stripe-slice';
import { sampleApi } from '../../pages/api-sample';
import { userSlice } from '../../pages/user/user-slice';
import { authSlice } from '../auth/auth-slice';
import { setStore } from './storeIsolated';

const reducer = {
  [authSlice.name]: authSlice.reducer,
  [sampleApi.reducerPath]: sampleApi.reducer,
  [importSlice.name]: importSlice.reducer,
  [userSlice.name]: userSlice.reducer,
  [stripeSlice.name]: stripeSlice.reducer,
  [exportCodeSlice.name]: exportCodeSlice.reducer,
  [githubSlice.name]: githubSlice.reducer,
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
