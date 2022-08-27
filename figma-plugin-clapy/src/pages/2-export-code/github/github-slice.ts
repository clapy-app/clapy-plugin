import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { FetchGithubCredentialsResp, Nil } from '../../../common/app-models.js';
import type { RootState } from '../../../core/redux/store.js';

export interface Repo {
  created_at: string | Nil;
  default_branch: string;
  description: string | Nil;
  disabled: boolean;
  full_name: string;
  git_url: string;
  html_url: string;
  id: number;
  name: string;
  node_id: string;
  owner: {
    id: number;
    login: string;
    node_id: string;
    type: string;
    url: string;
  };
  private: boolean;
  updated_at: string;
  url: string | Nil;
  visibility: string | Nil;
}

export interface ExportCodeState {
  credentials?: FetchGithubCredentialsResp;
  signInLoading?: boolean;
  signInAborter?: () => void;
  loadingRepos: boolean;
  repositories?: Repo[];
}

const initialState: ExportCodeState = {
  loadingRepos: true, // useLoadGHRepos starts loading immediately
};

// To add to src/core/redux/store.ts
export const githubSlice = createSlice({
  name: 'github',
  initialState,
  reducers: {
    setGHInitialCredentials: (state, { payload }: PayloadAction<FetchGithubCredentialsResp | undefined>) => {
      state.credentials = payload;
    },
    setGHAuthError: state => {
      state.credentials = undefined;
    },
    startGHSignIn: (state, { payload }: PayloadAction<{ signInAborter: AbortController }>) => {
      state.signInLoading = true;
      state.signInAborter = payload.signInAborter.abort.bind(payload.signInAborter);
    },
    endGHSignIn: state => {
      state.signInLoading = false;
      state.signInAborter = undefined;
    },
    startLoadingGHRepos: state => {
      state.loadingRepos = true;
      state.repositories = undefined;
    },
    setGHRepositories: (state, { payload }: PayloadAction<Repo[] | undefined>) => {
      state.loadingRepos = false;
      state.repositories = payload;
    },
  },
});

export const {
  setGHInitialCredentials,
  setGHAuthError,
  startGHSignIn,
  endGHSignIn,
  startLoadingGHRepos,
  setGHRepositories,
} = githubSlice.actions;

export const selectGHLoadingRepos = (state: RootState) => state.github.loadingRepos;
export const selectGHCredentials = (state: RootState) => state.github.credentials;
export const selectGHAccessToken = (state: RootState) => state.github.credentials?.accessToken;
export const selectGHHasPermission = (state: RootState) => state.github.credentials?.hasPermission;
export const selectGHSignInLoading = (state: RootState) => state.github.signInLoading;
export const selectGHSignInAborter = (state: RootState) => state.github.signInAborter;
export const selectGHRepos = (state: RootState) => state.github.repositories;
