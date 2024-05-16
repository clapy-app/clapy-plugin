import jwtDecode from 'jwt-decode';

import type { Nil } from '../../common/app-models.js';
import { signInCancelledCode } from '../../common/error-utils.js';
import { toConcurrencySafeAsyncFn, wait } from '../../common/general-utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { env, isFigmaPlugin } from '../../environment/env';
import { handleError, openNewTab, toastError } from '../../front-utils/front-utils';
import { apiGet, apiPost } from '../../front-utils/http.utils.js';
import type { ApiResponse } from '../../front-utils/unauthenticated-http.utils.js';
import { apiGetUnauthenticated, apiPostUnauthenticated } from '../../front-utils/unauthenticated-http.utils.js';
import { clearLocalUserMetadata, dispatchLocalUserMetadata, fetchUserMetadata } from '../../pages/user/user-service';
import { dispatchOther, readSelectorOnce } from '../redux/redux.utils';
import { createChallenge, createVerifier, mkUrl } from './auth-service.utils';
import {
  authSuccess,
  cancelAuth,
  setAuthError,
  setCheckingSessionState,
  setSignedInState,
  setTokenDecoded,
  startLoadingAuth,
} from './auth-slice';

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
  dispatchOther(setCheckingSessionState(true));

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
  await dispatchLocalUserMetadata(signedInState);
  dispatchOther(setCheckingSessionState(false));

  return await checkSessionComplete();
}

interface CheckSessionResp {
  ok: boolean;
  quotas: number;
  quotasMax: number;
  quotaDisabled?: boolean;
  isLicenseExpired: boolean;
}

/**
 * This method makes a full session check by calling the Clapy webservice to check the auth token, refresh if required, then fetch the user metadata.
 * It's not blocking the UI because the webservice can have a cold start. But the result will re-render the UI if the result is different from the cache.
 */
export async function checkSessionComplete() {
  const { data } = await apiGet<CheckSessionResp>('check-session');
  await fetchUserMetadata();
  return data;
}

export async function refreshUser() {
  await refreshTokens();
  await fetchUserMetadata();
}

export const signup = toConcurrencySafeAsyncFn(async () => {
  return login(true);
});

export const login = toConcurrencySafeAsyncFn(
  async (isSignUp?: boolean, options?: { extraScopes?: string[]; abortController?: AbortController }) => {
    let readToken: string | undefined = undefined,
      writeToken: string | undefined = undefined;
    try {
      const { extraScopes, abortController } = options || {};
      dispatchOther(startLoadingAuth());

      const verifier = createVerifier();
      const challenge = createChallenge(verifier);

      ({ readToken, writeToken } = await fetchReadWriteKeys());
      const authUrl = getAuthenticationURL(writeToken, challenge, { isSignUp, extraScopes });
      logoutLogin(authUrl);
      const authoCode = await waitForAuthorizationCode(readToken, abortController);
      const fetchTokensResp = await fetchTokensFromCode(authoCode, verifier, readToken);
      const { accessToken, tokenType, refreshToken } = fetchTokensResp;
      deleteReadToken(readToken);
      if (!accessToken) throw new Error('Access token obtained is falsy. Something is wrong.');

      setAccessToken(accessToken);
      _tokenType = tokenType;
      await fetchUserMetadata();
      await fetchPlugin('setCachedToken', accessToken, tokenType, refreshToken);
      dispatchOther(authSuccess());
    } catch (err: any) {
      if (readToken) {
        deleteReadToken(readToken);
      }
      if (err?.message === signInCancelledCode) {
        dispatchOther(cancelAuth());
        return;
      }
      handleError(err);
      dispatchOther(setAuthError(err));
      toastError(err);
    }
  },
);

// Github scopes: https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps
// Then Github API:
// - https://github.com/octokit/rest.js
// - https://octokit.github.io/rest.js/v18
export const requestAdditionalScopes = toConcurrencySafeAsyncFn(
  async (abortController: AbortController, extraScopes?: string | string[]) => {
    let readToken: string | undefined = undefined,
      writeToken: string | undefined = undefined;
    try {
      const verifier = createVerifier();
      const challenge = createChallenge(verifier);
      ({ readToken, writeToken } = await fetchReadWriteKeys());
      const authUrl = getAuthenticationURL(writeToken, challenge, {
        extraScopes,
        provider: 'github',
        addProvider: true,
      });
      openNewTab(authUrl);
      const authoCode = await waitForAuthorizationCode(readToken, abortController);
      const { accessToken, tokenType, refreshToken } = await fetchTokensFromCode(authoCode, verifier, readToken);
      if (!accessToken) throw new Error('Access token obtained is falsy. Something is wrong.');

      // Link accounts
      const linkOptions = { link_with: accessToken };
      await apiPost<ExchangeTokenResponse>('proxy-link-github', linkOptions);
    } finally {
      if (readToken) {
        deleteReadToken(readToken);
      }
    }
  },
);

const interactiveSignInMsg = 'Interactive sign in required';

export const getTokens = toConcurrencySafeAsyncFn(async () => {
  try {
    if (!_accessToken) {
      const { accessToken, tokenType } = await fetchPlugin('getCachedToken');
      setAccessToken(accessToken);
      _tokenType = tokenType;
    }
    if (!_accessToken || isJwtLikelyExpired()) {
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
    if (isInteractiveSignInMsg(error)) {
      dispatchOther(setSignedInState(false));
      return { accessToken: null, tokenType: null, accessTokenDecoded: null };
    } else {
      if (error.status === 401 || error.status === 403) {
        logout(true);
        const msg = "Please reauthenticate. Your session expired and couldn't be refreshed automatically.";
        error.message = msg;
        error.error = msg;
        error.data.error = msg;
        error.data.message = msg;
      }
      if (error?.message?.includes('getaddrinfo EAI_AGAIN')) {
        const msg =
          'The Clapy authentication service is not reachable. Please try again later and let us know if the problem persists.';
        error.message = msg;
        error.error = msg;
        error.data.error = msg;
        error.data.message = msg;
      }
      toastError(error);
      throw error;
    }
  }
});

export function isAuthError(error: any) {
  const statusCode = +(
    (error as ApiResponse<any>)?.status ||
    (error as ApiResponse<any>)?.data?.statusCode ||
    (error as any)?.statusCode
  );
  return statusCode === 401 || statusCode === 403 || isInteractiveSignInMsg(error);
}

export function isInteractiveSignInMsg(error: any) {
  return error?.message === interactiveSignInMsg;
}

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

function logoutLogin(loginUrl: string) {
  setAccessToken(null);
  _tokenType = null;
  clearLocalUserMetadata();
  fetchPlugin('clearCachedTokens').catch(handleError);
  const url = mkUrl(`https://${auth0Domain}/v2/logout`, {
    client_id: auth0ClientId,
    returnTo: loginUrl,
  });
  openNewTab(url);
}

// This function could be used in http.utils.ts to refresh the token before attempting a first request that will surely fail with an auth error.
export function isJwtLikelyExpired(accessTokenDecoded?: AccessTokenDecoded | Nil) {
  if (accessTokenDecoded == null) accessTokenDecoded = _accessTokenDecoded;
  return !accessTokenDecoded || Date.now() >= accessTokenDecoded.exp * 1000;
}

export async function getAuth0Id() {
  const { accessTokenDecoded } = await getTokens();
  return accessTokenDecoded ? accessTokenDecoded.sub : null;
}

export function getCurrentTokenExpiresIn() {
  return _accessTokenDecoded != null ? _accessTokenDecoded.exp * 1000 - Date.now() : null;
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
  'https://clapy.gitbook.io/roles'?: string[];
  'https://clapy.gitbook.io/licence-expiration-date'?: number;
  'https://clapy.gitbook.io/limited-user'?: boolean;
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

function getAuthenticationURL(
  state: string,
  challenge: string,
  options: {
    isSignUp?: boolean;
    provider?: 'github';
    extraScopes?: string | string[];
    addProvider?: boolean;
  } = {},
) {
  const { isSignUp, provider, extraScopes, addProvider } = options;
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
  if (provider) {
    data.connection = provider;
  }
  if (extraScopes) {
    // https://auth0.com/docs/authenticate/identity-providers/adding-scopes-for-an-external-idp#pass-scopes-to-authorize-endpoint
    data.connection_scope = Array.isArray(extraScopes) ? extraScopes.join(',') : extraScopes;
  }
  if (addProvider) {
    data.skip_manual_linking = true;
    data.max_age = 0;
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

const errorDescriptionsUserCancelled = new Set([
  'The user has denied your application access.',
  'User did not authorize the request',
]);

async function waitForAuthorizationCode(readToken: string, abortController?: AbortController) {
  let cancelled = false;
  if (abortController) {
    abortController.signal.onabort = () => {
      abortController.signal.onabort = null;
      cancelled = true;
    };
    if (abortController.signal.aborted) {
      cancelled = true;
    }
  }
  while (true) {
    if (cancelled) {
      throw new Error(signInCancelledCode);
    }
    const authoCode = await fetchAuthorizationCode(readToken);
    if (authoCode) {
      if (authoCode.startsWith('error|')) {
        const [_, errorMsg, errorDescription] = authoCode.split('|');
        const msg =
          errorMsg === 'access_denied' && errorDescriptionsUserCancelled.has(errorDescription)
            ? signInCancelledCode
            : `${errorMsg} - ${errorDescription}`;
        throw new Error(msg);
      }
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
