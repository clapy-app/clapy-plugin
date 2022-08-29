import { useEffect } from 'react';
import { toConcurrencySafeAsyncFn } from '../../../common/general-utils.js';
import { fetchPlugin } from '../../../common/plugin-utils.js';
import { requestAdditionalScopes } from '../../../core/auth/auth-service.js';
import { dispatchOther, readSelectorOnce } from '../../../core/redux/redux.utils.js';
import { handleError, toastError } from '../../../front-utils/front-utils.js';
import { getGithubCredentials, githubPost } from '../../../front-utils/http-github-utils.js';
import type { Repo } from './github-slice.js';
import {
  setGHSettings,
  selectGHRepos,
  endLoadingGHSettingsAndCredentials,
  startLoadingGHSettingsAndCredentials,
  setSelectedRepo,
  endGHSignIn,
  setGHRepositories,
  startGHSignIn,
  startLoadingGHRepos,
} from './github-slice.js';

// Load initial credentials and settings

export async function useLoadGHSettingsAndCredentials() {
  useEffect(() => {
    (async () => {
      try {
        await loadGHSettingsAndCredentials();
      } catch (err) {
        handleError(err);
        toastError(err);
      }
    })();
  }, []);
}

async function loadGHSettingsAndCredentials() {
  try {
    dispatchOther(startLoadingGHSettingsAndCredentials());
    await Promise.all([getGithubCredentials(), loadGHSettings()]);
  } finally {
    dispatchOther(endLoadingGHSettingsAndCredentials());
  }
}

async function loadGHSettings() {
  const settings = await fetchPlugin('getGithubSettings');
  dispatchOther(setGHSettings(settings));
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

export async function selectRepoInGHWizard(repo: string | null) {
  dispatchOther(setSelectedRepo(repo));
  await fetchPlugin('addRepoToSettings', repo);
}
