import type { FetchGithubCredentialsResp, GithubCredentials } from '../common/app-models.js';
import { fetchPlugin } from '../common/plugin-utils.js';
import { dispatchOther, readSelectorOnce } from '../core/redux/redux.utils.js';
import {
  selectGHCredentials,
  setGHAuthError,
  setGHInitialCredentials,
} from '../pages/2-export-code/github/github-slice.js';
import { apiPost } from './http.utils.js';
import type { ApiRequestConfig, ApiResponse } from './unauthenticated-http.utils.js';

export async function githubPost<T>(url: string, body?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
  return withAuthRetry(async () => apiPost(url, await addAuthBody(body), config));
}

export const noGithubTokenError = 'no_github_token';

async function withAuthRetry<T>(sendRequest: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    let resp: ApiResponse<T> | undefined;
    try {
      resp = await sendRequest();
    } catch (err: any) {
      const status = err?.status || err?.statusCode;
      if (!(status === 400 && err?.githubStatus === 401)) {
        throw err;
      }

      const githubCredentials = await fetchGithubToken();
      if (invalidGHCredentials(githubCredentials)) {
        throw new Error(noGithubTokenError);
      }
      // Save in plugin cache
      await fetchPlugin('setGithubCachedCredentials', githubCredentials);
      // Save in redux
      dispatchOther(setGHInitialCredentials(githubCredentials));

      console.info('Retrying HTTP request with refreshed github token...');
      try {
        resp = await sendRequest();
      } catch (err: any) {
        if (!(status === 400 && err?.githubStatus === 401)) {
          throw err;
        }
        throw new Error(noGithubTokenError);
      }
    }
    return resp;
  } catch (err: any) {
    if (err?.message === noGithubTokenError) {
      dispatchOther(setGHAuthError());
    }
    throw err;
  }
}

async function fetchGithubToken() {
  return (await apiPost<FetchGithubCredentialsResp>('github/token')).data;
}

async function addAuthBody<T>(body: T): Promise<T> {
  const githubCredentials = await getGithubCredentials();
  return { ...body, githubAccessToken: githubCredentials.accessToken };
}

export async function getGithubCredentials() {
  let githubCredentials = readSelectorOnce(selectGHCredentials);
  if (invalidGHCredentials(githubCredentials)) {
    githubCredentials = await fetchPlugin('getGithubCachedCredentials');
    if (invalidGHCredentials(githubCredentials)) {
      githubCredentials = await fetchGithubToken();
      // Save in plugin cache
      await fetchPlugin('setGithubCachedCredentials', githubCredentials);
    }
    // Save in redux
    dispatchOther(setGHInitialCredentials(githubCredentials));
  }
  if (invalidGHCredentials(githubCredentials)) {
    throw new Error(noGithubTokenError);
  }
  return githubCredentials as GithubCredentials;
}

export function invalidGHCredentials(credentials: FetchGithubCredentialsResp | undefined): credentials is undefined {
  return !credentials?.accessToken || !credentials?.hasPermission;
}
