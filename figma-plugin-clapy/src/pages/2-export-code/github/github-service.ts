import { useEffect } from 'react';
import type { FetchGithubCredentialsResp } from '../../../common/app-models.js';
import { fetchPlugin } from '../../../common/plugin-utils.js';
import { requestAdditionalScopes } from '../../../core/auth/auth-service.js';
import { dispatchOther } from '../../../core/redux/redux.utils.js';
import { handleError, toastError } from '../../../front-utils/front-utils.js';
import { apiGet } from '../../../front-utils/http.utils.js';
import { setGHInitialCredentials } from './github-slice.js';

export function useLoadGithubInitialState() {
  useEffect(() => {
    loadGithubInitialState().catch(err => {
      handleError(err);
      toastError(err);
    });
  }, []);
}

async function loadGithubInitialState() {
  // TODO for dev
  // await fetchPlugin('setGithubCachedCredentials', undefined);
  // /TODO
  let githubCredentials = await fetchPlugin('getGithubCachedCredentials');
  if (!githubCredentials) {
    try {
      ({ data: githubCredentials } = await apiGet<FetchGithubCredentialsResp>('github/gh-token'));
    } catch (err: any) {
      if (err.githubStatus === 401) {
        githubCredentials = undefined;
      } else {
        throw err;
      }
    }
  }
  // Could be undefined if the user has not signed in with GitHub yet.
  // Could also have the wrong permissions. Should we check them in the github/gh-token route?
  dispatchOther(setGHInitialCredentials(githubCredentials));
  await fetchPlugin('setGithubCachedCredentials', githubCredentials);
}

export async function signInToGithubWithScope(abortController: AbortController) {
  // Later, for other operations with github:
  // let githubAccessToken = await fetchPlugin('getGithubCachedCredentials');

  // const githubAccessToken = readSelectorOnce(selectGHAccessToken);
  // if (!githubAccessToken) {
  //   // Should show the "Sign in with Github" button.
  //   dispatchOther(setInitialCredentials(undefined));
  //   return;
  // }

  // Add an abortable event listener to cancel the subscription once the response is received.
  await requestAdditionalScopes(abortController, ['repo', 'user:email']);
  // const { data } = await apiPost<ListReposResp>('github/list-repos', {
  //   githubAccessToken,
  // } as ListReposReq);
  // let repositories: GHRepo[];
  // ({ githubAccessToken, repositories } = data);
  // await fetchPlugin('setGithubCachedCredentials', githubAccessToken);
  // console.log('repositories:', repositories);
}
