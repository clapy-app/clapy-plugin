import { Routes } from '../../common/appModels';

export const isFigmaPlugin = window.location.origin === 'null';

type UnPromise<T> = T extends Promise<infer U> ? U : T;

// Usage: `fetchPlugin('createRectangles', count)`
// We could have set an alternative syntax (not implemented): `fetchPlugin('createRectangles')(count)`.
export async function fetchPlugin<T extends keyof Routes>(routeName: T, ...args: Parameters<Routes[T]>): Promise<UnPromise<ReturnType<Routes[T]>>> {

  // Mocks to test the authentication on the browser.
  if (!isFigmaPlugin) {
    if (routeName === 'getCachedToken') {
      return mock_getCachedToken() as any;
    }
    if (routeName === 'setCachedToken') {
      return ((mock_setCachedToken as (...args: any) => any)(...args as any) as any);
    }
    if (routeName === 'getRefreshToken') {
      return mock__getRefreshToken() as any;
    }
    if (routeName === 'clearCachedTokens') {
      return mock__clearCachedTokens() as any;
    }
    throw new Error(`Call to Figma plugin not mocked in the browser: ${routeName}`);
  }

  return new Promise<UnPromise<ReturnType<Routes[T]>>>((resolve, reject) => {
    // Add an abortable event listener to cancel the subscription once the response is received.
    const aborter = new AbortController();
    // Listen to responses from the server. We listen to all messages and filter by type.
    // Then, for a one-shot fetch, we cancel the subscription.
    window.addEventListener("message", event => {
      const { type, payload, error } = event.data.pluginMessage;
      if (type === routeName) {
        if (error) {
          reject(error);
        } else {
          resolve(payload);
        }
        aborter.abort();
      }
    }, { signal: aborter.signal });
    parent.postMessage({ pluginMessage: { type: routeName, payload: args } }, '*');
  });
}

// Skip the response part. Avoid it until you know a response would be painful, e.g. when closing the plugin (emitting a response causes a useless warning because the UI has been destroyed).
export function fetchPluginNoResponse<T extends keyof Routes>(routeName: T, ...args: Parameters<Routes[T]>): void {
  parent.postMessage({ pluginMessage: { type: routeName, payload: args, noResponse: true } }, '*');
}


// Mocks

function getLS(key: string) {
  try {
    return JSON.parse(localStorage.getItem(`figma_mock__${key}`) || 'null');
  } catch (err) {
    return null;
  }
}

function setLS(key: string, value: any) {
  localStorage.setItem(`figma_mock__${key}`, JSON.stringify(value));
}

function rmLS(key: string) {
  localStorage.removeItem(`figma_mock__${key}`);
}

async function mock_getCachedToken() {
  return {
    accessToken: getLS('accessToken') as string,
    tokenType: getLS('tokenType') as string,
  };
}

async function mock_setCachedToken(accessToken: string, tokenType: string, refreshToken: string) {
  setLS('accessToken', accessToken);
  setLS('tokenType', tokenType);
  setLS('refreshToken', refreshToken);
}

async function mock__getRefreshToken() {
  return getLS('refreshToken') as string;
}

async function mock__clearCachedTokens() {
  rmLS('accessToken');
  rmLS('tokenType');
  rmLS('refreshToken');
}
