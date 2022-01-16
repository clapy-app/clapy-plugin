import { dispatchOther } from '../core/redux/redux.utils';
import { env } from '../environment/env';
import { handleError } from '../utils/error-utils';
import { fetchPlugin, isFigmaPlugin } from '../utils/ui-utils';
import { createChallenge, createVerifier, mkUrl } from './auth-service.utils';
import { authSuccess, setAuthError, startLoadingAuth } from './auth-slice';

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

    fetchPlugin('setCachedToken', accessToken, tokenType, refreshToken);
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
    // Silent authentication with auth0 or, if it doesn't work here, use refresh token here.
  }
  return { accessToken: _accessToken, tokenType: _tokenType };
}


// Steps (detail)

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

// async function refreshTokens() {
//   const refreshToken = await keytar.getPassword(keytarService, keytarAccount);

//   if (refreshToken) {
//     const refreshOptions = {
//       method: "POST",
//       url: `https://${auth0Domain}/oauth/token`,
//       headers: { "content-type": "application/json" },
//       data: {
//         grant_type: "refresh_token",
//         client_id: auth0ClientId,
//         refresh_token: refreshToken,
//       },
//     };

//     try {
//       const response = await axios(refreshOptions);

//       accessToken = response.data.access_token;
//       profile = jwtDecode(response.data.id_token);
//     } catch (error) {
//       await logout();

//       throw error;
//     }
//   } else {
//     throw new Error("No available refresh token.");
//   }
// }

async function fetchTokensFromCode(code: string, verifier: string, readToken: string) {
  const exchangeOptions = {
    grant_type: "authorization_code",
    client_id: auth0ClientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  };

  const url = mkUrl(`${apiBaseUrl}/proxy-get-token`, { read_token: readToken });

  try {
    const rawResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(exchangeOptions)
    });
    // Example of response:
    // access_token: "eyJhbGciOiJSUzI1N...QbpMeOXvDQ"
    // expires_in: 86400
    // refresh_token: "v1.McBQzYi89tbOf...k7QUPI5aKQ"
    // scope: "offline_access"
    // token_type: "Bearer"
    const { access_token, token_type, refresh_token/* , expires_in, id_token */ } = await rawResponse.json();

    // profile = jwtDecode(id_token);

    return { accessToken: access_token, tokenType: token_type, refreshToken: refresh_token/* , profile */ };

    // if (refreshToken) {
    //   await keytar.setPassword(keytarService, keytarAccount, refreshToken);
    // }
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
  const url = `${apiBaseUrl}/generate-tokens`;
  return await (await fetch(url)).json();
}

async function fetchAuthorizationCode(readToken: string) {
  const url = mkUrl(`${apiBaseUrl}/read-code`, { read_token: readToken });
  const code = (await (await fetch(url)).json())?.code;
  return code;
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
  const url = mkUrl(`${apiBaseUrl}/delete-read-token`, { read_token: readToken });
  const resp = await (await fetch(url)).json();
  if (!resp?.deleted) {
    handleError('After getting the authorization token, did not delete the read token. Something is wrong in the workflow.');
  }
}
