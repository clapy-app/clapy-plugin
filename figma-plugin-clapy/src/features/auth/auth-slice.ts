import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from '../../core/redux/store';

export interface AuthState {
  loading: boolean;
  error?: any;
  isSignedIn?: boolean;
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
  },
});

export const { startLoadingAuth, authSuccess, setAuthError, setSignedInState } = authSlice.actions;

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectSignedIn = (state: RootState) => state.auth.isSignedIn;
