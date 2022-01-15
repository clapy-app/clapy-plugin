import { env } from '../environment/env';
import { createChallenge, createVerifier } from './auth-service.utils';
import { handleError } from './error-utils';
import { fetchPlugin, isFigmaPlugin } from './ui-utils';

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

let accessToken: string | null = null;
// let profile: string | null = null;
// let refreshToken: string | null = null;
// let _readToken: string | null = null;

// function getAccessToken() {
//   return accessToken;
// }

// function getProfile() {
//   return profile;
// }

function mkUrl(baseAndPath: string, queryObject?: any) {
  if (!queryObject) return baseAndPath;
  const queryParams = new URLSearchParams(queryObject).toString();
  return `${baseAndPath}?${queryParams}`;
}

function getAuthenticationURL(state: string, challenge: string) {
  const data = {
    // scope: 'openid profile offline_access',
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

async function loadTokens(code: string, verifier: string, readToken: string) {
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
    const response = await rawResponse.json();

    accessToken = response.access_token;
    // profile = jwtDecode(response.id_token);
    // refreshToken = response.refresh_token;

    return { accessToken/* , refreshToken, profile */ };

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
  accessToken = null;
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

async function fetchAuthoCode(readToken: string) {
  const url = mkUrl(`${apiBaseUrl}/read-code`, { read_token: readToken });
  const code = (await (await fetch(url)).json())?.code;
  return code;
}

async function waitForAuthorizationCode(readToken: string/* , authWindow: Window | null */) {
  while (true) {
    const authoCode = await fetchAuthoCode(readToken);
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

// Higher level

export async function login() {
  const authWindow = isFigmaPlugin ? null : window.open(undefined, '_blank');
  if (!isFigmaPlugin && !authWindow) throw new Error('Cannot open a window to authenticate. Something is wrong.');

  console.log('Start logging in...');

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
  const { accessToken/* , refreshToken, profile */ } = await loadTokens(authoCode, verifier, readToken);
  deleteReadToken(readToken);
  if (!accessToken) throw new Error('Access token obtained is falsy. Something is wrong.');
  console.log('tokens:', accessToken/* , refreshToken, profile */);

  fetchPlugin('setCachedToken', accessToken);
  return accessToken;
}

// module.exports = {
//   getAccessToken,
//   getAuthenticationURL,
//   getLogOutUrl,
//   getProfile,
//   loadTokens,
//   logout,
//   // refreshTokens,
//   login,
// };
