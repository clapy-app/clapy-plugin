import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../core/redux/store';

export interface AuthState {
  loading?: boolean;
  error?: any;
}

const initialState: AuthState = {};

// To add to src/core/redux/store.ts
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    startLoadingAuth: (state) => {
      state.loading = true;
      state.error = undefined;
    },
    authSuccess: (state) => {
      state.loading = undefined;
      state.error = undefined;
    },
    setAuthError: (state, { payload }: PayloadAction<any>) => {
      state.loading = undefined;
      state.error = payload;
    },
  },
});

export const { startLoadingAuth, authSuccess, setAuthError } = authSlice.actions;

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
