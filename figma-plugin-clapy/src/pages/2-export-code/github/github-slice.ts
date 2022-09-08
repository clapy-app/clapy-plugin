import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { GithubCredentials, Nil, ValueOf } from '../../../common/app-models.js';
import { setRepoInSettings } from '../../../common/github-shared-utils.js';
import type { GithubSettings, SelectedRepo } from '../../../common/sb-serialize.model.js';
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

export interface Branch {
  commit: {
    sha: string;
    url: string;
  };
  name: string;
  protected: boolean;
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
  // Branches
  loadingBranches?: boolean;
  branches?: Branch[];
}

export interface GitHubSettingPayload {
  name: keyof GithubSettings;
  value: ValueOf<GithubSettings>;
}

export const codegenBranchDefaultValue = 'gencode';

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
      state.settings = payload || {};
      // Default settings
      if (!state.settings.codegenBranch) {
        state.settings.codegenBranch = codegenBranchDefaultValue;
      }
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
      // state.repositories = undefined;
    },
    setGHRepositories: (state, { payload }: PayloadAction<Repo[] | undefined>) => {
      state.loadingRepos = false;
      state.repositories = payload;
    },
    setSelectedRepo: (state, { payload }: PayloadAction<SelectedRepo | undefined>) => {
      if (!state.settings) state.settings = {};
      const newRepo = payload || undefined;

      // Clear list of branches
      const prevRepo = state.settings.repository;
      if (newRepo !== prevRepo) {
        state.branches = undefined;
      }
      state.settings = setRepoInSettings(state.settings, newRepo);
    },
    // Branches
    startLoadingGHBranches: state => {
      state.loadingBranches = true;
      // state.branches = undefined;
    },
    setGHBranches: (state, { payload }: PayloadAction<Branch[] | undefined>) => {
      state.loadingBranches = false;
      state.branches = payload;
    },
    setSelectedTargetBranch: (state, { payload }: PayloadAction<string | Nil>) => {
      if (!state.settings) state.settings = {};
      state.settings.mergeToBranch = payload || undefined;
    },
    setSelectedCodeGenBranch: (state, { payload }: PayloadAction<string | Nil>) => {
      if (!state.settings) state.settings = {};
      state.settings.codegenBranch = payload || undefined;
    },
    setGitHubSetting: (state, { payload: { name, value } }: PayloadAction<GitHubSettingPayload>) => {
      if (!state.settings) state.settings = {};
      state.settings[name] = (value ||
        undefined) as any /* WritableDraft<GithubSettings[typeof name]> */ /* WritableDraft<UserSettingPayload['value']> */;
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
  // Branches
  startLoadingGHBranches,
  setGHBranches,
  setSelectedTargetBranch,
  setSelectedCodeGenBranch,
  setGitHubSetting,
} = githubSlice.actions;

// Load initial credentials
export const selectIsLoadingGHSettings = (state: RootState) => state.github.loadingSettings;
export const selectGHCredentials = (state: RootState) => state.github.credentials;
export const selectGHAccessToken = (state: RootState) => state.github.credentials?.accessToken;
export const selectGHHasPermission = (state: RootState) => state.github.credentials?.hasPermission;
// Sign in if required
export const selectGHSignInLoading = (state: RootState) => state.github.signInLoading;
export const selectGHSignInAborter = (state: RootState) => state.github.signInAborter;
// Load repositories
export const selectGHLoadingRepos = (state: RootState) => state.github.loadingRepos;
export const selectGHRepos = (state: RootState) => state.github.repositories; /* ?.map(repo => repo.full_name) */
export const selectGHHasRepoSelected = (state: RootState) => !!state.github.settings?.repository;
export const selectGHSelectedRepoFromCache = (state: RootState) => state.github.settings?.repository;
export const selectGHSelectedRepo = createSelector(
  selectGHRepos,
  selectGHSelectedRepoFromCache,
  (repos, selectedRepoFromCache) => {
    if (repos) {
      return repos.find(repo => repo.full_name === selectedRepoFromCache?.fullName);
    } else if (!selectedRepoFromCache) {
      return undefined;
    } else {
      const repo = {
        full_name: selectedRepoFromCache.fullName,
        name: selectedRepoFromCache.repo,
        owner: {
          login: selectedRepoFromCache.owner,
        } as Repo['owner'],
      } as Repo;
      return repo;
    }
  },
);
export const selectGHReposOrJustSelection = createSelector(
  selectGHSelectedRepo,
  (state: RootState) => state.github.repositories,
  (selectedRepo, repositories) =>
    repositories /* ?.map(repo => repo.full_name) */ ||
    (selectedRepo ? [selectedRepo /* as unknown as Repo */] : undefined),
);
// Load branches
export const selectGHLoadingBranches = (state: RootState) => state.github.loadingBranches;
export const selectGHBranches = (state: RootState) => state.github.branches?.map(branch => branch.name);
export const selectGHHasTargetBranchSelected = (state: RootState) => !!state.github.settings?.mergeToBranch;
export const selectGHSelectedTargetBranch = (state: RootState) => state.github.settings?.mergeToBranch;
export const selectGHBranchesOrJustSelection = createSelector(
  selectGHSelectedTargetBranch,
  (state: RootState) => state.github.branches,
  (selectedBranch, branches) => branches?.map(branch => branch.name) || (selectedBranch ? [selectedBranch] : undefined),
);
export const selectGHHasCodegenBranchSelected = (state: RootState) => !!state.github.settings?.codegenBranch;
export const selectGHSelectedCodegenBranch = (state: RootState) => state.github.settings?.codegenBranch;

export const selectGitHubReady = (state: RootState) =>
  !!(
    state.github.credentials?.accessToken &&
    state.github.credentials?.hasPermission &&
    state.github.settings?.repository &&
    state.github.settings?.codegenBranch &&
    state.github.settings?.mergeToBranch
  );
