import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Nil } from '../../common/app-models';
import { RootState } from '../redux/store';
import { AccessTokenDecoded, roleAlphaDTC } from './auth-service';

export interface AuthState {
  loading: boolean;
  error?: any;
  isSignedIn?: boolean;
  tokenDecoded?: AccessTokenDecoded | Nil;
}

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
  state.auth.tokenDecoded?.['https://clapy.co/roles']?.includes(roleAlphaDTC);