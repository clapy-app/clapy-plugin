import { useEffect } from 'react';
import { requestAdditionalScopes } from '../../../core/auth/auth-service.js';
import { dispatchOther } from '../../../core/redux/redux.utils.js';
import { handleError, toastError } from '../../../front-utils/front-utils.js';
import { githubPost } from '../../../front-utils/http-github-utils.js';
import type { Repo } from './github-slice.js';
import { endGHSignIn, setGHRepositories, startGHSignIn, startLoadingGHRepos } from './github-slice.js';

export async function signInToGithubWithScope() {
  try {
    // Add an abortable event listener to cancel the subscription once the response is received.
    const aborter = new AbortController();
    dispatchOther(startGHSignIn({ signInAborter: aborter }));
    await requestAdditionalScopes(aborter, ['repo', 'user:email']);
    await loadGHRepos();
  } finally {
    dispatchOther(endGHSignIn());
  }
}

export function useLoadGHRepos() {
  useEffect(() => {
    loadGHRepos().catch(err => {
      handleError(err);
      toastError(err);
    });
  }, []);
}

export async function loadGHRepos() {
  try {
    dispatchOther(startLoadingGHRepos());
    const { data } = await githubPost<Repo[]>('github/list-repos');
    dispatchOther(setGHRepositories(data));
  } catch (err) {
    handleError(err);
    toastError(err);
    dispatchOther(setGHRepositories(undefined));
  }
}
