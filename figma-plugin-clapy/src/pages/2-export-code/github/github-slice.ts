import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { FetchGithubCredentialsResp } from '../../../common/app-models.js';
import type { RootState } from '../../../core/redux/store.js';

export interface ExportCodeState {
  initialLoadingDone?: boolean;
  credentials?: FetchGithubCredentialsResp;
  signInLoading?: boolean;
  signInAborter?: () => void;
}

const initialState: ExportCodeState = {};

// To add to src/core/redux/store.ts
export const githubSlice = createSlice({
  name: 'github',
  initialState,
  reducers: {
    setGHInitialCredentials: (state, { payload }: PayloadAction<FetchGithubCredentialsResp | undefined>) => {
      state.initialLoadingDone = true;
      state.credentials = payload;
    },
    startGHSignIn: (state, { payload }: PayloadAction<{ signInAborter: AbortController }>) => {
      state.signInLoading = true;
      state.signInAborter = payload.signInAborter.abort.bind(payload.signInAborter);
    },
    endGHSignIn: state => {
      state.signInLoading = false;
      state.signInAborter = undefined;
    },
  },
});

export const { setGHInitialCredentials, startGHSignIn, endGHSignIn } = githubSlice.actions;

export const selectGHInitialLoadingDone = (state: RootState) => state.github.initialLoadingDone;
export const selectGHAccessToken = (state: RootState) => state.github.credentials?.accessToken;
export const selectGHHasPermission = (state: RootState) => state.github.credentials?.hasPermission;
export const selectGHSignInLoading = (state: RootState) => state.github.signInLoading;
export const selectGHSignInAborter = (state: RootState) => state.github.signInAborter;
