import type { EventClosedListener, EventConnectedListener, EventErrorListener } from 'graphql-ws';
import { CloseCode, createClient } from 'graphql-ws';

import { flags } from '../../common/app-config.js';
import { wait } from '../../common/general-utils.js';
import { env } from '../../environment/env.js';
import { handleError } from '../../front-utils/front-utils.js';
import { getTokens, refreshTokens } from '../auth/auth-service.js';

const verboseLogs = flags.verbose || env.isDev;

// indicates that the server closed the connection because of
// an auth problem. it indicates that the token should refresh
let shouldRefreshToken = false;

export function mkWSClient() {
  return createClient({
    url: env.hasuraGraphQLWS,
    shouldRetry: errOrCloseEvent => {
      if (verboseLogs) {
        console.log('Check shouldRetry with arg:', errOrCloseEvent);
      }
      return true;
    },
    retryAttempts: Infinity, // keep retrying while the browser is open
    retryWait: async function waitForServerHealthyBeforeRetry() {
      // See here for recommended implementation: https://github.com/enisdenjo/graphql-ws#retry-strategy
      await wait(1000);
    },
    // If we want a websocket connection for unauthenticated requests as well, we would need to update `connectionParams` to accept the case when we are not authenticated and don't try to fetch the tokens.
    connectionParams: async () => {
      // Hasura takes care of closing the websocket connection when the JWT expires. `getTokens` will eventually find that the JWT is expired and refresh itself.
      // In case the client clock is not well synced and doesn't detect the JWT expired, the below block catches when the websocket closes for auth reasons.
      let refreshed = false;
      if (shouldRefreshToken) {
        // refresh the token because it is no longer valid
        await refreshTokens();
        // and reset the flag to avoid refreshing too many times
        shouldRefreshToken = false;
        refreshed = true;
      }

      // Get latest tokens
      let { tokenType, accessToken } = await getTokens();
      // If it's expired (and the client doesn't know), try to refresh it.
      if (!accessToken && !refreshed) {
        await refreshTokens();
        ({ tokenType, accessToken } = await getTokens());
      }
      if (!accessToken) {
        throw new Error(`BUG Unable to get an access token to initialize the websocket connection.`);
      }
      return { headers: { Authorization: `${tokenType} ${accessToken}` } };
    },
    // More examples of how to use events:
    // And Official recipes: https://github.com/enisdenjo/graphql-ws#recipes
    // Issue about auth: https://github.com/enisdenjo/graphql-ws/issues/105
    on: {
      connected: ((socket: WebSocket) => {
        if (verboseLogs) {
          console.log('Websocket connected.');
        }
      }) as EventConnectedListener,
      closed: ((event: CloseEvent) => {
        if (event.code === 1006 && event.reason === '') {
          if (verboseLogs) {
            console.log('Websocket closed by Hasura, no specified reasons but likely because the JWT expired.');
          }
          shouldRefreshToken = true;
        } else if (event.code === 1000 && event.type === 'close' && event.reason === 'Normal Closure') {
          if (verboseLogs) {
            console.log('Websocket closed following an `unsubscribe`, which is likely normal.');
          }
        } else if (isClosedBecauseOfAuth(event)) {
          console.warn('(unexpected) Websocket closed for auth reason, will refresh tokens. Reason:', event.reason);
          shouldRefreshToken = true;
        } else {
          console.warn('(unexpected) Websocket closed. Event:', event);
        }
      }) as EventClosedListener,
      error: ((error: any) => {
        if (error) {
          error.message = `[Websocket error] - ${error.message}`;
        }
        handleError(error);
      }) as EventErrorListener,
    },
  });
}

function isClosedBecauseOfAuth(event: CloseEvent) {
  return (
    event.code === CloseCode.Forbidden ||
    event.code === CloseCode.Unauthorized ||
    (event.code === CloseCode.BadRequest &&
      (event.reason.includes('JWTExpired') || event.reason.includes('JWTIssuedAtFuture')))
  );
}
