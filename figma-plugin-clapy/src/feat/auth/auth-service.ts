import { handleError } from '../../common/error-utils';
import { wait } from '../../common/general-utils';
import { fetchPlugin, isFigmaPlugin } from '../../common/plugin-utils';
import { apiGetUnauthenticated, apiPostUnauthenticated } from '../../common/unauthenticated-http.utils';
import { dispatchOther } from '../../core/redux/redux.utils';
import { env } from '../../environment/env';
import { createChallenge, createVerifier, mkUrl } from './auth-service.utils';
import { authSuccess, setAuthError, setSignedInState, startLoadingAuth } from './auth-slice';

const { auth0Domain, auth0ClientId, apiBaseUrl } = env;

const redirectUri = `${apiBaseUrl}/login/callback`;

let _accessToken: string | null = null;
let _tokenType: string | null = null;

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
  } catch (err) {
    handleError(err);
    dispatchOther(setAuthError(err));
  }
}

const interactiveSignInMsg = 'Interactive sign in required';

export async function getTokens() {
  try {
    if (!_accessToken) {
      const { accessToken, tokenType } = await fetchPlugin('getCachedToken');
      _accessToken = accessToken;
      _tokenType = tokenType;
    }
    if (!_accessToken) {
      await refreshTokens();
    }
    dispatchOther(setSignedInState(!!_accessToken));
    return { accessToken: _accessToken, tokenType: _tokenType };
  } catch (error: any) {
    if (error.message === interactiveSignInMsg) {
      dispatchOther(setSignedInState(false));
      return { accessToken: null, tokenType: null };
    } else {
      throw error;
    }
  }
}

export async function refreshTokens() {
  let refreshToken: string | null = await fetchPlugin('getRefreshToken');
  if (Array.isArray(refreshToken) && !refreshToken.length) {
    console.warn('The refresh token is an empty array! This is not expected, resetting to null.');
    refreshToken = null;
  }
  if (refreshToken) {
    // If a refresh token is available, use it to generate a new access token.
    const { accessToken, tokenType, newRefreshToken } = await fetchRefreshedTokens(refreshToken);
    _accessToken = accessToken;
    _tokenType = tokenType;
    await fetchPlugin('setCachedToken', accessToken, tokenType, newRefreshToken);
    return;
  }
  // Otherwise, it fails here. A manual login is required.
  throw new Error(interactiveSignInMsg);
}

export function logout() {
  _accessToken = null;
  _tokenType = null;
  const url = mkUrl(`https://${auth0Domain}/v2/logout`, {
    client_id: auth0ClientId,
    returnTo: `${apiBaseUrl}/logged-out`,
  });
  window.open(url, '_blank');
  fetchPlugin('clearCachedTokens').catch(handleError);
  dispatchOther(setSignedInState(false));
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
    grant_type: 'authorization_code',
    client_id: auth0ClientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  };

  const { data } = await apiPostUnauthenticated<ExchangeTokenResponse>('proxy-get-token', exchangeOptions, {
    headers: { read_token: readToken },
  });
  const { access_token, token_type, refresh_token } = data;
  return { accessToken: access_token, tokenType: token_type, refreshToken: refresh_token };
}

async function fetchRefreshedTokens(refreshToken: string) {
  const exchangeOptions = {
    grant_type: 'refresh_token',
    client_id: auth0ClientId,
    scope: 'offline_access',
    refresh_token: refreshToken,
  };

  const { data } = await apiPostUnauthenticated<ExchangeTokenResponse>('proxy-refresh-token', exchangeOptions);
  const { access_token, token_type, refresh_token } = data;
  return { accessToken: access_token, tokenType: token_type, newRefreshToken: refresh_token };
}

async function fetchReadWriteKeys() {
  const { data } = await apiGetUnauthenticated<{ readToken: string; writeToken: string }>('generate-tokens');
  return data;
}

async function fetchAuthorizationCode(readToken: string) {
  const { data } = await apiGetUnauthenticated<{ code: string }>('read-code', { headers: { read_token: readToken } });
  return data?.code;
}

async function waitForAuthorizationCode(readToken: string) {
  while (true) {
    const authoCode = await fetchAuthorizationCode(readToken);
    if (authoCode) {
      return authoCode;
    }
    await wait(500);
  }
}

async function deleteReadToken(readToken: string) {
  const { data } = await apiGetUnauthenticated<{ deleted: boolean }>('delete-read-token', {
    headers: { read_token: readToken },
  });
  if (!data?.deleted) {
    handleError(
      'After getting the authorization token, did not delete the read token. Something is wrong in the workflow.',
    );
  }
}