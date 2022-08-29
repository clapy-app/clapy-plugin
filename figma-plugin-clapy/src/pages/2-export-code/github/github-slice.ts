import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { GithubCredentials, GithubSettings, Nil } from '../../../common/app-models.js';
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
  // Initial credentials
  loadingSettings: boolean;
  credentials?: GithubCredentials;
  settings?: GithubSettings;
  // Sign in
  signInLoading?: boolean;
  signInAborter?: () => void;
  // Repo
  loadingRepos?: boolean;
  repositories?: Repo[];
}

const initialState: ExportCodeState = {
  loadingSettings: true, // useLoadGHSettingsAndCredentials starts loading immediately
};

// To add to src/core/redux/store.ts
export const githubSlice = createSlice({
  name: 'github',
  initialState,
  reducers: {
    // Load initial credentials
    startLoadingGHSettingsAndCredentials: state => {
      state.loadingSettings = true;
    },
    endLoadingGHSettingsAndCredentials: state => {
      state.loadingSettings = false;
    },
    setGHInitialCredentials: (state, { payload }: PayloadAction<GithubCredentials | undefined>) => {
      state.credentials = payload;
    },
    setGHAuthError: state => {
      state.credentials = undefined;
    },
    setGHSettings: (state, { payload }: PayloadAction<GithubSettings | undefined>) => {
      state.settings = payload;
    },
    // Sign in if required
    startGHSignIn: (state, { payload }: PayloadAction<{ signInAborter: AbortController }>) => {
      state.signInLoading = true;
      state.signInAborter = payload.signInAborter.abort.bind(payload.signInAborter);
    },
    endGHSignIn: state => {
      state.signInLoading = false;
      state.signInAborter = undefined;
    },
    // Load repositories
    startLoadingGHRepos: state => {
      state.loadingRepos = true;
      state.repositories = undefined;
    },
    setGHRepositories: (state, { payload }: PayloadAction<Repo[] | undefined>) => {
      state.loadingRepos = false;
      state.repositories = payload;
    },
    setSelectedRepo: (state, { payload }: PayloadAction<string | Nil>) => {
      if (!state.settings) state.settings = {};
      state.settings.repository = payload || undefined;
    },
  },
});

export const {
  // Load initial credentials
  startLoadingGHSettingsAndCredentials,
  endLoadingGHSettingsAndCredentials,
  setGHInitialCredentials,
  setGHAuthError,
  setGHSettings,
  // Sign in if required
  startGHSignIn,
  endGHSignIn,
  // Load repositories
  startLoadingGHRepos,
  setGHRepositories,
  setSelectedRepo,
} = githubSlice.actions;

export const selectIsLoadingGHSettings = (state: RootState) => state.github.loadingSettings;
export const selectGHLoadingRepos = (state: RootState) => state.github.loadingRepos;
export const selectGHCredentials = (state: RootState) => state.github.credentials;
export const selectGHAccessToken = (state: RootState) => state.github.credentials?.accessToken;
export const selectGHHasPermission = (state: RootState) => state.github.credentials?.hasPermission;
export const selectGHSignInLoading = (state: RootState) => state.github.signInLoading;
export const selectGHSignInAborter = (state: RootState) => state.github.signInAborter;
export const selectGHRepos = (state: RootState) => state.github.repositories?.map(repo => repo.full_name);
export const selectGHHasRepoSelected = (state: RootState) => !!state.github.settings?.repository;
export const selectGHSelectedRepo = (state: RootState) => state.github.settings?.repository;
