import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { Nil } from '../../common/app-models';
import type { RootState } from '../redux/store';
import type { AccessTokenDecoded } from './auth-service';

export interface AuthState {
  loading: boolean;
  error?: any;
  isSignedIn?: boolean;
  isSessionChecking?: boolean;
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
    setCheckingSessionState: (state, { payload }: PayloadAction<boolean>) => {
      state.isSessionChecking = payload;
    },
    setTokenDecoded: (state, { payload }: PayloadAction<AccessTokenDecoded | Nil>) => {
      state.tokenDecoded = payload;
    },
  },
});

export const {
  startLoadingAuth,
  authSuccess,
  setAuthError,
  setSignedInState,
  setTokenDecoded,
  setCheckingSessionState,
} = authSlice.actions;

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectSessionChecking = (state: RootState) => state.auth.isSessionChecking;

export const selectAuthError = (state: RootState) => state.auth.error;
export const selectSignedIn = (state: RootState) => !!state.auth.isSignedIn;
export const selectTokenDecoded = (state: RootState) => state.auth.tokenDecoded;
export const selectIsAlphaDTCUser = (state: RootState) =>
  state.auth.tokenDecoded?.['https://clapy.co/roles']?.includes('alpha_design_to_code');
export const selectNoCodesandboxUser = (state: RootState) =>
  state.auth.tokenDecoded?.['https://clapy.co/roles']?.includes('noCodesandbox');
export const selectIncreasedQuotaUser = (state: RootState) =>
  state.auth.tokenDecoded?.['https://clapy.co/roles']?.includes('increasedQuota');
export const selectUserLicenceExpirationDate = (state: RootState) =>
  state.auth.tokenDecoded?.['https://clapy.co/licence-expiration-date'];
export const selectGithubEnabled = (state: RootState) =>
  state.auth.tokenDecoded?.['https://clapy.co/roles']?.includes('github_integration');
export const selectDevTools = (state: RootState) =>
  state.auth.tokenDecoded?.['https://clapy.co/roles']?.includes('dev_tools');
export const selectCssOptionEnabled = (state: RootState) => true;
export const selectFreeStripeAccess = (state: RootState) => hasRoleFreeStripeAccess(state.auth.tokenDecoded);
export const selectIsNewUserTmp = (state: RootState) => isNewUserTmp(state.auth.tokenDecoded);
export const selectIsStripeEnabled = (state: RootState) => isStripeEnabled(state.auth.tokenDecoded);

// TODO edit here and in src/features/user/user.utils.ts
export const hasRoleFreeStripeAccess = (user: AccessTokenDecoded | Nil) =>
  user?.['https://clapy.co/roles']?.includes('FreeStripeAccess');

export const isStripeEnabled = (user: AccessTokenDecoded | Nil) => {
  return isNewUserTmp(user);
};

function isNewUserTmp(user: AccessTokenDecoded | Nil) {
  return !!user?.['https://clapy.co/limited-user'];
}
