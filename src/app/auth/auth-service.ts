import { dispatchOther } from '../core/redux/redux.utils';
import { env } from '../environment/env';
import { handleError } from '../utils/error-utils';
import { fetchPlugin, isFigmaPlugin } from '../utils/ui-utils';
import { createChallenge, createVerifier, mkUrl } from './auth-service.utils';
import { authSuccess, setAuthError, startLoadingAuth } from './auth-slice';
import { apiGetUnauthenticated, apiPostUnauthenticated } from './unauthenticated-http.utils';

// TODO next step: validate the access token (tuto online)


// const jwtDecode = require("jwt-decode");
// const axios = require("axios");
// const url = require("url");
// const envVariables = require("../env-variables");
// const keytar = require("keytar");
// const os = require("os");

// const { apiIdentifier, auth0Domain, clientId } = envVariables;
const { auth0Domain, auth0ClientId, apiBaseUrl } = env;

// const redirectUri = "http://localhost/callback";
const redirectUri = `${apiBaseUrl}/login/callback`;

// const keytarService = "electron-openid-oauth";
// const keytarAccount = os.userInfo().username;

let _accessToken: string | null = null;
let _tokenType: string | null = null;
// let profile: string | null = null;
// let refreshToken: string | null = null;
// let _readToken: string | null = null;

// function getAccessToken() {
//   return accessToken;
// }

// function getProfile() {
//   return profile;
// }

// Exported methods

export async function login() {
  try {
    const authWindow = isFigmaPlugin ? null : window.open(undefined, '_blank');
    if (!isFigmaPlugin && !authWindow) throw new Error('Cannot open a window to authenticate. Something is wrong.');

    dispatchOther(startLoadingAuth());

    const verifier = createVerifier();
    const challenge = createChallenge(verifier);

    const { readToken, writeToken } = await fetchReadWriteKeys();
    const authUrl = getAuthenticationURL(writeToken, challenge);
    if (isFigmaPlugin) {
      window.open(authUrl, '_blank');
    } else {
      authWindow!.location.href = authUrl;
    }
    const authoCode = await waitForAuthorizationCode(readToken);
    const { accessToken, tokenType, refreshToken } = await fetchTokensFromCode(authoCode, verifier, readToken);
    deleteReadToken(readToken);
    if (!accessToken) throw new Error('Access token obtained is falsy. Something is wrong.');

    _accessToken = accessToken;
    _tokenType = tokenType;

    await fetchPlugin('setCachedToken', accessToken, tokenType, refreshToken);
    dispatchOther(authSuccess());
    // return { accessToken, tokenType };
  } catch (err) {
    handleError(err);
    dispatchOther(setAuthError(err));
  }
}

export async function getTokens() {
  if (!_accessToken) {
    const { accessToken, tokenType } = await fetchPlugin('getCachedToken');
    _accessToken = accessToken;
    _tokenType = tokenType;
  }
  if (!_accessToken) {
    await refreshTokens();
  }
  return { accessToken: _accessToken, tokenType: _tokenType };
}

export async function refreshTokens() {
  const refreshToken = await fetchPlugin('getRefreshToken');
  if (refreshToken) {
    // If a refresh token is available, use it to generate a new access token.
    const { accessToken, tokenType, newRefreshToken } = await fetchRefreshedTokens(refreshToken);
    _accessToken = accessToken;
    _tokenType = tokenType;
    await fetchPlugin('setCachedToken', accessToken, tokenType, newRefreshToken);
    return;
  }
  // Otherwise, it fails here. A manual login is required.
  throw new Error('Unauthenticated user');
}


// Steps (detail)

interface ExchangeTokenResponse {
  access_token: string; // "eyJhbGciOiJSUzI1N...QbpMeOXvDQ"
  expires_in: number; // 86400
  refresh_token: string; // "v1.McBQzYi89tbOf...k7QUPI5aKQ"
  scope: string; // "offline_access"
  token_type: string; // "Bearer"
}

function getAuthenticationURL(state: string, challenge: string) {
  const data = {
    audience: env.auth0Audience,
    // scope: 'openid profile offline_access',
    scope: 'offline_access',
    response_type: 'code',
    client_id: auth0ClientId,
    redirect_uri: redirectUri,
    state,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  };
  return mkUrl(`https://${auth0Domain}/authorize`, data);
}

async function fetchTokensFromCode(code: string, verifier: string, readToken: string) {
  const exchangeOptions = {
    grant_type: "authorization_code",
    client_id: auth0ClientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  };

  try {
    const { data } = await apiPostUnauthenticated<ExchangeTokenResponse>('proxy-get-token', exchangeOptions, { query: { read_token: readToken } });
    const { access_token, token_type, refresh_token/* , expires_in */ } = data;

    return { accessToken: access_token, tokenType: token_type, refreshToken: refresh_token };
  } catch (error) {
    await logout();

    throw error;
  }
}

async function fetchRefreshedTokens(refreshToken: string) {
  const exchangeOptions = {
    grant_type: "refresh_token",
    client_id: auth0ClientId,
    scope: 'offline_access',
    refresh_token: refreshToken,
  };

  try {
    const { data } = await apiPostUnauthenticated<ExchangeTokenResponse>('proxy-refresh-token', exchangeOptions);

    const { access_token, token_type, refresh_token } = data;

    return { accessToken: access_token, tokenType: token_type, newRefreshToken: refresh_token };
  } catch (error) {
    await logout();

    throw error;
  }
}

async function logout() {
  // await keytar.deletePassword(keytarService, keytarAccount);
  // accessToken = null;
  // profile = null;
  // refreshToken = null;
  // TODO should call logout URL
}

// function getLogOutUrl() {
//   return `https://${auth0Domain}/v2/logout`;
// }

async function fetchReadWriteKeys() {
  const { data } = await apiGetUnauthenticated<{ readToken: string, writeToken: string; }>('generate-tokens');
  return data;
}

async function fetchAuthorizationCode(readToken: string) {
  const { data } = await apiGetUnauthenticated<{ code: string; }>('read-code', { query: { read_token: readToken } });
  return data?.code;
}

async function waitForAuthorizationCode(readToken: string/* , authWindow: Window | null */) {
  while (true) {
    const authoCode = await fetchAuthorizationCode(readToken);
    if (authoCode) {
      return authoCode;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function deleteReadToken(readToken: string) {
  const { data } = await apiGetUnauthenticated<{ deleted: boolean; }>('delete-read-token', { query: { read_token: readToken } });
  if (!data?.deleted) {
    handleError('After getting the authorization token, did not delete the read token. Something is wrong in the workflow.');
  }
}
