import jwtDecode from 'jwt-decode';

import { handleError } from '../../common/error-utils';
import { openWindowStep1, openWindowStep2 } from '../../common/front-utils';
import { wait } from '../../common/general-utils';
import { fetchPlugin, isFigmaPlugin } from '../../common/plugin-utils';
import { apiGetUnauthenticated, apiPostUnauthenticated } from '../../common/unauthenticated-http.utils';
import { dispatchOther } from '../../core/redux/redux.utils';
import { env } from '../../environment/env';
import { createChallenge, createVerifier, mkUrl } from './auth-service.utils';
import { authSuccess, setAuthError, setSignedInState, setTokenDecoded, startLoadingAuth } from './auth-slice';

const { auth0Domain, auth0ClientId, apiBaseUrl } = env;

const redirectUri = `${apiBaseUrl}/login/callback?from=${isFigmaPlugin ? 'desktop' : 'browser'}`;
const loggedOutCallbackUrl = `${apiBaseUrl}/logged-out?from=${isFigmaPlugin ? 'desktop' : 'browser'}`;

let _accessToken: string | null = null;
/**
 * Don't use unless you know what you are doing. Prefer getToken() instead.
 */
export let _accessTokenDecoded: AccessTokenDecoded | null = null;
let _tokenType: string | null = null;

// Exported methods

export async function login() {
  try {
    const authWindow = openWindowStep1();

    dispatchOther(startLoadingAuth());

    const verifier = createVerifier();
    const challenge = createChallenge(verifier);

    const { readToken, writeToken } = await fetchReadWriteKeys();
    const authUrl = getAuthenticationURL(writeToken, challenge);
    openWindowStep2(authWindow, authUrl);
    const authoCode = await waitForAuthorizationCode(readToken);
    const { accessToken, tokenType, refreshToken } = await fetchTokensFromCode(authoCode, verifier, readToken);
    deleteReadToken(readToken);
    if (!accessToken) throw new Error('Access token obtained is falsy. Something is wrong.');

    setAccessToken(accessToken);
    _tokenType = tokenType;

    await fetchPlugin('setCachedToken', accessToken, tokenType, refreshToken);
    dispatchOther(authSuccess());
  } catch (err) {
    handleError(err);
    dispatchOther(setAuthError(err));
  }
}

const interactiveSignInMsg = 'Interactive sign in required';

// TODO if getTokens and refreshTokens have concurrent calls, they should run only once and return the same promise.
export async function getTokens() {
  try {
    if (!_accessToken) {
      const { accessToken, tokenType } = await fetchPlugin('getCachedToken');
      setAccessToken(accessToken);
      _tokenType = tokenType;
    }
    if (!_accessToken) {
      await refreshTokens();
    }
    dispatchOther(setSignedInState(!!_accessToken));
    return { accessToken: _accessToken, tokenType: _tokenType, accessTokenDecoded: _accessTokenDecoded };
  } catch (error: any) {
    if (error.message === interactiveSignInMsg) {
      dispatchOther(setSignedInState(false));
      return { accessToken: null, tokenType: null, accessTokenDecoded: null };
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
    setAccessToken(accessToken);
    _tokenType = tokenType;
    await fetchPlugin('setCachedToken', accessToken, tokenType, newRefreshToken);
    return;
  }
  // Otherwise, it fails here. A manual login is required.
  throw new Error(interactiveSignInMsg);
}

export function logout() {
  setAccessToken(null);
  _tokenType = null;
  const url = mkUrl(`https://${auth0Domain}/v2/logout`, {
    client_id: auth0ClientId,
    returnTo: loggedOutCallbackUrl,
  });
  window.open(url, '_blank');
  fetchPlugin('clearCachedTokens').catch(handleError);
  dispatchOther(setSignedInState(false));
}

export async function getAuth0Id() {
  const { accessTokenDecoded } = await getTokens();
  return accessTokenDecoded ? accessTokenDecoded.sub : null;
}

// Steps (detail)

export const roleAlphaDTC = 'alpha_design_to_code';

export interface AccessTokenDecoded {
  // Audience - if array, second member could be "https://clapy.eu.auth0.com/userinfo"
  aud: 'clapy' | ['clapy', ...string[]];
  azp: string; // "6erPCh883JBV4COxwAHLbhbgNgarqaq5" - Client ID of the app to which the token was delivered
  exp: number; // 1647606409 - Expiration time
  'https://hasura.io/jwt/claims': {
    'x-hasura-allowed-roles': string[]; // ['team@earlymetrics.com', 'all@foo.com']
    'x-hasura-default-role': string; //"team@earlymetrics.com"
    'x-hasura-user-id': string; // "auth0|622f597dc4b56e0071615ebe"} - auth0 user ID repeated for Hasura
  };
  'https://clapy.co/roles'?: string[];
  iat: number; // 1647520009 - Issued at
  iss: string; // "https://clapy.eu.auth0.com/" - Issuer
  scope: string; // "offline_access"
  sub: string; // "auth0|622f597dc4b56e0071615ebe" - auth0 user ID
}

interface ExchangeTokenResponse {
  access_token: string; // "eyJhbGciOiJSUzI1N...QbpMeOXvDQ"
  expires_in: number; // 86400
  id_token?: string; // If the scope openid is provided
  refresh_token: string; // "v1.McBQzYi89tbOf...k7QUPI5aKQ"
  scope: string; // "offline_access"
  token_type: string; // "Bearer"
}

function getAuthenticationURL(state: string, challenge: string) {
  const data = {
    audience: env.auth0Audience,
    // Add openid to get an ID token along with the access token
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
    from: isFigmaPlugin ? 'desktop' : 'browser',
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

function setAccessToken(accessToken: string | null) {
  _accessToken = accessToken;
  _accessTokenDecoded = accessToken ? jwtDecode<AccessTokenDecoded>(accessToken) : null;
  dispatchOther(setTokenDecoded(_accessTokenDecoded));
}
