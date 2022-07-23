import jwtDecode from 'jwt-decode';

import { handleError } from '../../common/error-utils';
import { openNewTab, toastError } from '../../common/front-utils';
import { toConcurrencySafeAsyncFn, wait } from '../../common/general-utils';
import { apiGet } from '../../common/http.utils.js';
import { fetchPlugin } from '../../common/plugin-utils';
import { apiGetUnauthenticated, apiPostUnauthenticated } from '../../common/unauthenticated-http.utils';
import { env, isFigmaPlugin } from '../../environment/env';
import { clearLocalUserMetadata, dispatchLocalUserMetadata, fetchUserMetadata } from '../../pages/user/user-service';
import { dispatchOther, readSelectorOnce } from '../redux/redux.utils';
import { createChallenge, createVerifier, mkUrl } from './auth-service.utils';
import { authSuccess, setAuthError, setSignedInState, setTokenDecoded, startLoadingAuth } from './auth-slice';

const { auth0Domain, auth0ClientId, apiBaseUrl } = env;

const redirectUri = `${apiBaseUrl}/login/callback?from=${isFigmaPlugin ? 'desktop' : 'browser'}`;
const loggedOutCallbackUrl = `${apiBaseUrl}/logged-out?from=${isFigmaPlugin ? 'desktop' : 'browser'}`;

/** Don't use unless you know what you are doing. Prefer getToken() instead. */
export let _accessToken: string | null = null;
/** Don't use unless you know what you are doing. Prefer getToken() instead. */
export let _accessTokenDecoded: AccessTokenDecoded | null = null;
/** Don't use unless you know what you are doing. Prefer getToken() instead. */
export let _tokenType: string | null = null;

// Exported methods

/**
 * This methods makes a light session check by only checking the local cache, to unlock the UI as quickly as possible.
 * It ends by calling the method for a full check with the server, in case something is wrong. The result will then re-render the UI if something changed.
 */
export async function checkSessionLight() {
  if (!_accessToken) {
    const { accessToken, tokenType } = await fetchPlugin('getCachedToken');
    setAccessToken(accessToken);
    _tokenType = tokenType;
  }

  // Don't dispatch unless it has changed, to avoid causing errors in the UI
  // when reading the token in the middle of a component action (and state change).
  const signedInState = !!_accessToken;
  const { isSignedIn, loading } = readSelectorOnce(({ auth: { isSignedIn, loading } }) => ({ isSignedIn, loading }));
  if (loading || signedInState !== isSignedIn) {
    dispatchOther(setSignedInState(signedInState));
  }
  await dispatchLocalUserMetadata();
  await checkSessionComplete();
}

/**
 * This method makes a full session check by calling the Clapy webservice to check the auth token, refresh if required, then fetch the user metadata.
 * It's not blocking the UI because the webservice can have a cold start. But the result will re-render the UI if the result is different from the cache.
 */
async function checkSessionComplete() {
  await apiGet('check-session');
  await fetchUserMetadata();
}

export const signup = toConcurrencySafeAsyncFn(async () => {
  return login(true);
});

export const login = toConcurrencySafeAsyncFn(async (isSignUp?: boolean) => {
  let readToken: string | undefined = undefined,
    writeToken: string | undefined = undefined;
  try {
    dispatchOther(startLoadingAuth());

    const verifier = createVerifier();
    const challenge = createChallenge(verifier);

    ({ readToken, writeToken } = await fetchReadWriteKeys());
    const authUrl = getAuthenticationURL(writeToken, challenge, isSignUp);
    openNewTab(authUrl);
    const authoCode = await waitForAuthorizationCode(readToken);
    const { accessToken, tokenType, refreshToken } = await fetchTokensFromCode(authoCode, verifier, readToken);
    deleteReadToken(readToken);
    if (!accessToken) throw new Error('Access token obtained is falsy. Something is wrong.');

    setAccessToken(accessToken);
    _tokenType = tokenType;
    await Promise.all([fetchPlugin('setCachedToken', accessToken, tokenType, refreshToken), fetchUserMetadata()]);
    dispatchOther(authSuccess());
  } catch (err) {
    if (readToken) {
      deleteReadToken(readToken);
    }
    handleError(err);
    dispatchOther(setAuthError(err));
    toastError(err);
  }
});

const interactiveSignInMsg = 'Interactive sign in required';

export const getTokens = toConcurrencySafeAsyncFn(async () => {
  try {
    if (!_accessToken) {
      const { accessToken, tokenType } = await fetchPlugin('getCachedToken');
      setAccessToken(accessToken);
      _tokenType = tokenType;
    }
    if (!_accessToken) {
      await refreshTokens();
    }

    // Don't dispatch unless it has changed, to avoid causing errors in the UI
    // when reading the token in the middle of a component action (and state change).
    const signedInState = !!_accessToken;
    const { isSignedIn, loading } = readSelectorOnce(({ auth: { isSignedIn, loading } }) => ({ isSignedIn, loading }));
    if (loading || signedInState !== isSignedIn) {
      dispatchOther(setSignedInState(signedInState));
    }
    return { accessToken: _accessToken, tokenType: _tokenType, accessTokenDecoded: _accessTokenDecoded };
  } catch (error: any) {
    if (error.message === interactiveSignInMsg) {
      dispatchOther(setSignedInState(false));
      return { accessToken: null, tokenType: null, accessTokenDecoded: null };
    } else {
      dispatchOther(setAuthError(error));
      toastError(error);
      throw error;
    }
  }
});

export const refreshTokens = toConcurrencySafeAsyncFn(async () => {
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
    // await findUserMetadata();
    await fetchPlugin('setCachedToken', accessToken, tokenType, newRefreshToken);
    return;
  }
  // Otherwise, it fails here. A manual login is required.
  throw new Error(interactiveSignInMsg);
});

export function logout(mustReauth?: boolean) {
  setAccessToken(null);
  _tokenType = null;
  clearLocalUserMetadata();
  if (!mustReauth) {
    const url = mkUrl(`https://${auth0Domain}/v2/logout`, {
      client_id: auth0ClientId,
      returnTo: mustReauth ? `${loggedOutCallbackUrl}&reauth` : loggedOutCallbackUrl,
    });
    openNewTab(url);
  }
  fetchPlugin('clearCachedTokens').catch(handleError);
  dispatchOther(setSignedInState(false));
}

export async function getAuth0Id() {
  const { accessTokenDecoded } = await getTokens();
  return accessTokenDecoded ? accessTokenDecoded.sub : null;
}

// Steps (detail)

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

function getAuthenticationURL(state: string, challenge: string, isSignUp: boolean | undefined) {
  const data: any = {
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
  if (isSignUp) {
    data.prompt = 'login';
    data.screen_hint = 'signup';
  }
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
    await wait(1000);
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
