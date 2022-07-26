import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { Nil } from '../../common/app-models';
import { isUserLicenceStillActive } from '../../common/stripeLicense.js';
import type { RootState } from '../redux/store';
import type { AccessTokenDecoded } from './auth-service';

export interface AuthState {
  loading: boolean;
  error?: any;
  isSignedIn?: boolean;
  tokenDecoded?: AccessTokenDecoded | Nil;
}

// Switch loading to true to block the app until the session is checked.
const initialState: AuthState = { loading: true };

// To add to src/core/redux/store.ts
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    startLoadingAuth: state => {
      state.loading = true;
      state.error = undefined;
    },
    authSuccess: state => {
      state.loading = false;
      state.error = undefined;
      state.isSignedIn = true;
    },
    setAuthError: (state, { payload }: PayloadAction<any>) => {
      state.loading = false;
      state.error = payload;
      state.isSignedIn = false;
    },
    setSignedInState: (state, { payload }: PayloadAction<boolean>) => {
      state.isSignedIn = payload;
      state.loading = false;
    },
    setTokenDecoded: (state, { payload }: PayloadAction<AccessTokenDecoded | Nil>) => {
      state.tokenDecoded = payload;
    },
  },
});

export const { startLoadingAuth, authSuccess, setAuthError, setSignedInState, setTokenDecoded } = authSlice.actions;

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectSignedIn = (state: RootState) => state.auth.isSignedIn;
export const selectTokenDecoded = (state: RootState) => state.auth.tokenDecoded;
export const selectIsAlphaDTCUser = (state: RootState) =>
  state.auth.tokenDecoded?.['https://clapy.co/roles']?.includes('alpha_design_to_code');
export const selectUserLicenceExpirationDate = (state: RootState) =>
  state.auth.tokenDecoded?.['https://clapy.co/licenceExpirationDate'];
export const selectIsPaidUser = (state: RootState) =>
  isUserLicenceStillActive(state.auth.tokenDecoded?.['https://clapy.co/licenceExpirationDate']);
