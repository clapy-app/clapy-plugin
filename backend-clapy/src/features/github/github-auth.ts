// import axios from 'axios';
//
// import { env } from '../../env-and-config/env.js';
//
// var options = {
//   method: 'POST',
//   url: `https://${env.auth0Domain}/oauth/token`,
//   headers: { 'content-type': 'application/x-www-form-urlencoded' },
//   data: new URLSearchParams({
//     grant_type: 'client_credentials',
//     client_id: env.auth0BackendClientId,
//     client_secret: env.auth0BackendClientSecret,
//     audience: `https://${env.auth0Domain}/api/v2/`,
//   }),
// };
//
// export async function printToken() {
//   try {
//     const response = await axios.request(options);
//     console.log(response.data);
//   } catch (error) {
//     console.error(error);
//   }
// }
import type { AxiosResponse } from 'axios';
import axios from 'axios';

import { getAuth0User } from '../user/user.utils.js';

export async function fetchGHTest() {
  try {
    // const path = 'users/codertocat';
    const path = 'users/antoineol';
    let { data, accessToken } = await fetchGithub(path, 'google-oauth2|105573232794317486965', undefined);
    ({ data, accessToken } = await fetchGithub(path, 'google-oauth2|105573232794317486965', accessToken));
    console.log('response:', data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('code:', error.code);
      console.error(error.response?.data || error.stack || error);
    }
  }
}

export interface GHRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
  };
  html_url: string;
  description: string;
}

export function listGHRepos(authUserId: string, accessToken: string | undefined) {
  return fetchGithub<GHRepo[]>('/user/repos', authUserId, accessToken);
}

async function fetchGithub<GithubResp>(path: string, authUserId: string, accessToken: string | undefined) {
  if (path == null) path = '';
  if (!path.startsWith('/')) path = `/${path}`;
  if (!accessToken) {
    accessToken = await fetchGithubAccessToken(authUserId);
  }
  if (!accessToken) {
    throw new Error(`[BUG] Couldn't fetch github token from Auth0. Please contact us to fix it.`);
  }
  let response: AxiosResponse<GithubResp>;
  try {
    response = await axios.get(`https://api.github.com${path}`, {
      params: { visibility: 'private' },
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${accessToken}`,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.warn('Retry with new token');
      accessToken = await fetchGithubAccessToken(authUserId);
      if (!accessToken) {
        throw new Error(`[BUG] Couldn't fetch github token from Auth0 when retrying. Please contact us to fix it.`);
      }
      response = await axios.get(`https://api.github.com${path}`, {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      });
    } else {
      throw error;
    }
  }
  return { ...response, accessToken };
}

let firstTokenFetch = true;

export async function fetchGithubAccessToken(authUserId: string) {
  if (firstTokenFetch) {
    firstTokenFetch = false;
    return 'faketoken';
  }
  const auth0User = await getAuth0User(authUserId);
  return auth0User.identities?.find(idp => idp.provider === 'github')?.access_token;
}
