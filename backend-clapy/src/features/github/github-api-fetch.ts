import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { env } from '../../env-and-config/env.js';

import { getAuth0User } from '../user/auth0-management-api.js';
import type { GHContext } from './github-service.js';

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

export function listGHReposAPI(context: GHContext) {
  return fetchGithub<RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data']>(
    '/user/repos',
    context,
  );
}

export async function ensureAccessTokenDefined(auth0UserId: string, accessToken: string | undefined) {
  if (!accessToken) {
    if (env.isDev) {
      console.warn('Missing github access token. Fetching it from the Auth0 Management API...');
    }
    accessToken = await fetchGithubAccessTokenOrThrow(auth0UserId);
  }
  return accessToken;
}

async function fetchGithub<GithubResp>(path: string, context: GHContext) {
  let { auth0UserId, accessToken } = context;
  if (path == null) path = '';
  if (!path.startsWith('/')) path = `/${path}`;
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
      if (env.isDev) {
        console.warn('Invalid github access token. Refetching it from the Auth0 Management API...');
      }
      accessToken = await fetchGithubAccessTokenOrThrow(auth0UserId);
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

// let firstTokenFetch = false;

export async function fetchGithubAccessTokenOrThrow(auth0UserId: string) {
  // if (firstTokenFetch) {
  //   firstTokenFetch = false;
  //   return 'faketoken';
  // }
  const accessToken = await fetchGithubAccessToken(auth0UserId);
  if (!accessToken) {
    throw new Error(`BUG missing github access token in Auth0 identities`);
  }
  return accessToken;
}

export async function fetchGithubAccessToken(auth0UserId: string) {
  const auth0User = await getAuth0User(auth0UserId);
  return auth0User.identities?.find(idp => idp.provider === 'github')?.access_token;
}
