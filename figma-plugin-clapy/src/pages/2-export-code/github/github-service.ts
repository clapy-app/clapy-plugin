import { useEffect } from 'react';

import { toConcurrencySafeAsyncFn } from '../../../common/general-utils.js';
import { fetchPlugin } from '../../../common/plugin-utils.js';
import type { SelectedRepo } from '../../../common/sb-serialize.model.js';
import { requestAdditionalScopes } from '../../../core/auth/auth-service.js';
import { dispatchOther, readSelectorOnce } from '../../../core/redux/redux.utils.js';
import { handleError, toastError } from '../../../front-utils/front-utils.js';
import { getGithubCredentials, githubPost, isNoGHTokenError } from '../../../front-utils/http-github-utils.js';
import type { Branch, Repo } from './github-slice.js';
import {
  endGHSignIn,
  endLoadingGHSettingsAndCredentials,
  selectGHBranches,
  selectGHRepos,
  selectGHSelectedRepo,
  setGHBranches,
  setGHRepositories,
  setGHSettings,
  setSelectedCodeGenBranch,
  setSelectedRepo,
  setSelectedTargetBranch,
  startGHSignIn,
  startLoadingGHBranches,
  startLoadingGHRepos,
  startLoadingGHSettingsAndCredentials,
} from './github-slice.js';

// Load initial credentials and settings

export async function useLoadGHSettingsAndCredentials() {
  useEffect(() => {
    (async () => {
      try {
        await loadGHSettingsAndCredentials();
      } catch (err) {
        if (!isNoGHTokenError(err)) {
          handleError(err);
          toastError(err);
        }
      }
    })();
  }, []);
}

export async function loadGHSettingsAndCredentials() {
  try {
    dispatchOther(startLoadingGHSettingsAndCredentials());
    return await Promise.all([getGithubCredentials(), loadGHSettings()]);
  } finally {
    dispatchOther(endLoadingGHSettingsAndCredentials());
  }
}

export async function loadGHSettings() {
  const settings = await fetchPlugin('getGithubSettings');
  dispatchOther(setGHSettings(settings));
  return settings;
}

// Sign in if required

export async function signInToGithubWithScope() {
  try {
    // Add an abortable event listener to cancel the subscription once the response is received.
    const aborter = new AbortController();
    dispatchOther(startGHSignIn({ signInAborter: aborter }));
    await requestAdditionalScopes(aborter, ['repo', 'user:email']);
    // await loadGHRepos();
    await loadGHSettingsAndCredentials();
  } finally {
    dispatchOther(endGHSignIn());
  }
}

// Load repositories

export function useLoadGHReposIfEditable(edit: boolean) {
  useEffect(() => {
    if (edit) {
      loadGHRepos().catch(err => {
        handleError(err);
        toastError(err);
      });
    }
  }, [edit]);
}

export const loadGHRepos = toConcurrencySafeAsyncFn(async (force?: boolean) => {
  try {
    const repos = readSelectorOnce(selectGHRepos);

    // Load the repositories only once, unless we force reload.
    if (repos && !force) return;

    dispatchOther(startLoadingGHRepos());
    const { data } = await githubPost<Repo[]>('github/list-repos');
    dispatchOther(setGHRepositories(data));
  } catch (err) {
    handleError(err);
    toastError(err);
    dispatchOther(setGHRepositories(undefined));
  }
});

export async function selectRepoInGHWizard(repo: Repo | null) {
  const selectedRepo: SelectedRepo | undefined = repo
    ? {
        fullName: repo.full_name,
        owner: repo.owner.login,
        repo: repo.name,
      }
    : undefined;
  dispatchOther(setSelectedRepo(selectedRepo));
  await fetchPlugin('addRepoToSettings', selectedRepo);
}

// Branches

export function useLoadGHBranchesIfEditable(edit: boolean, branches: string[] | undefined) {
  const hasBranches = !!branches?.length;
  useEffect(() => {
    if (edit && !hasBranches) {
      loadGHBranches().catch(err => {
        handleError(err);
        toastError(err);
      });
    }
  }, [edit, hasBranches]);
}

interface ListBranchesReq {
  owner: string;
  repo: string;
}

export const loadGHBranches = toConcurrencySafeAsyncFn(async (force?: boolean) => {
  try {
    const branches = readSelectorOnce(selectGHBranches);

    // Load the branches only once, unless we force reload.
    if (branches && !force) return;

    dispatchOther(startLoadingGHBranches());
    const selectedRepo = readSelectorOnce(selectGHSelectedRepo);
    if (!selectedRepo)
      throw new Error('BUG cannot fetch branches because because the selected repository is undefined.');
    const body: ListBranchesReq = {
      owner: selectedRepo.owner.login,
      repo: selectedRepo.name,
    };
    const { data } = await githubPost<Branch[]>('github/list-branches', body);
    dispatchOther(setGHBranches(data));
  } catch (err) {
    handleError(err);
    toastError(err);
    dispatchOther(setGHBranches(undefined));
  }
});

export async function setTargetBranchInGHWizard(branch: string | null) {
  dispatchOther(setSelectedTargetBranch(branch));
  await fetchPlugin('addTargetBranchToSettings', branch || undefined);
}

export async function setCodeGenBranchInGHWizard(branch: string | null) {
  dispatchOther(setSelectedCodeGenBranch(branch));
  await fetchPlugin('addCodeGenBranchToSettings', branch || undefined);
}
