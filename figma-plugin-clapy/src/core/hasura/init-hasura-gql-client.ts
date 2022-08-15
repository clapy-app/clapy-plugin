import { retryExchange } from '@urql/exchange-retry';
import type { Client as WSClient } from 'graphql-ws';
import { cacheExchange, createClient, dedupExchange, fetchExchange, subscriptionExchange } from 'urql';

import { env } from '../../environment/env.js';

export function mkGqlClient(wsClient: WSClient) {
  return createClient({
    url: env.hasuraGraphQL,
    exchanges: [
      // ...defaultExchanges, // dedupExchange, cacheExchange and fetchExchange
      dedupExchange,
      cacheExchange,
      //     errorExchange({
      //       onError: error => {
      //         const isAuthErr = error.graphQLErrors.some(isAuthError);
      //         if (debugGqlFlow) {
      //           console.log('[onError] isAuthErr:', isAuthErr);
      //         }
      //
      //         if (isAuthErr) {
      //           console.log('BUG auth error that the authExchange could not recover from.');
      //           logout();
      //         }
      //       },
      //     }),
      // // authExchange({
      // //   getAuth,
      // //   addAuthToOperation,
      // //   didAuthError,
      // //   willAuthError,
      // // }),
      retryExchange({
        initialDelayMs: 500, // default: 1000
        maxDelayMs: 1500, // default: 15000
        randomDelay: true,
        maxNumberAttempts: Infinity,
      }),
      fetchExchange,
      subscriptionExchange({
        forwardSubscription: operation => ({
          subscribe: sink => ({
            unsubscribe: wsClient!.subscribe(operation, sink),
          }),
        }),
      }),
    ],
  });
}

//
///// The commented code below is to handle authentication with graphql over HTTP (not websocket).
///// It will be useful later if some of (or all) the requests go through HTTP.
///// But for now, everything goes through websocket.
//

// const debugGqlFlow = true;
//
// type AuthState = UnwrapPromiseLike<ReturnType<typeof getTokens>>;
//
// const getAuth: AuthConfig<AuthState>['getAuth'] = async ({ authState }) => {
//   if (!authState) {
//     if (debugGqlFlow) {
//       console.log('[getAuth] initial state, no authState');
//     }
//     // Initial fetch of token, no refresh yet
//     return await getTokens();
//   }
//
//   if (debugGqlFlow) {
//     console.log('[getAuth] later, received a 401 (tokens to refresh), with authState:', authState);
//   }
//
//   // Got auth error in a previous request (401), refreshing.
//   await refreshTokens();
//   const tokens = await getTokens();
//
//   // Then sending the new token to retry.
//   if (tokens.accessToken) {
//     if (debugGqlFlow) {
//       console.log('[getAuth] OK, got refreshed tokens.');
//     }
//     return tokens;
//   }
//
//   // If no token, something went wrong in the refresh. We log out.
//   console.warn('BUG no access token after refresh, but no error thrown. Logging out, but it is not normal.');
//   logout(true);
//   return null;
// };
//
// let firstOp = true;
//
// const addAuthToOperation: AuthConfig<AuthState>['addAuthToOperation'] = ({ authState, operation }) => {
//   if (!authState || !authState.accessToken) {
//     if (debugGqlFlow) {
//       console.log('[addAuthToOperation] No access token, keep urql operation unauthenticated');
//     }
//     return operation;
//   }
//
//   const fetchOptions =
//     typeof operation.context.fetchOptions === 'function'
//       ? operation.context.fetchOptions()
//       : operation.context.fetchOptions || {};
//
//   if (debugGqlFlow) {
//     console.log('[addAuthToOperation] Add access token to operation');
//   }
//   return makeOperation(operation.kind, operation, {
//     ...operation.context,
//     fetchOptions: {
//       ...fetchOptions,
//       headers: {
//         ...fetchOptions.headers,
//         Authorization: `${authState.tokenType} ${authState.accessToken}`,
//         // To check in dev if something fails because of permission issue.
//         // 'X-Hasura-Role': 'admin',
//         // 'X-Hasura-Admin-Secret': 'secret',
//       },
//     },
//   });
// };
//
// const didAuthError: AuthConfig<AuthState>['didAuthError'] = ({ error }) => {
//   if (debugGqlFlow) {
//     console.log('DEBUG [didAuthError] GraphQL error:', error);
//   }
//   // To adapt to the API error response when the request is unauthenticated but should be.
//   return error.graphQLErrors.some(isAuthError);
// };
//
// function isAuthError(e: GraphQLError) {
//   if (debugGqlFlow) {
//     console.log(
//       '[isAuthError] e.extensions?.code:',
//       e.extensions?.code,
//       '- (e as any).response?.status:',
//       (e as any).response?.status,
//     );
//   }
//   return (
//     e.extensions?.code === 'FORBIDDEN' || e.extensions?.code === 'invalid-jwt' || (e as any).response?.status === 401
//   );
// }
//
// const willAuthError: AuthConfig<AuthState>['willAuthError'] = ({ authState }) => {
//   if (debugGqlFlow) {
//     console.log('[willAuthError] with authState:', authState);
//   }
//   // If the login is done through graphql (a mutation), we need a more elaborate willAuthError. See:
//   // https://formidable.com/open-source/urql/docs/advanced/authentication/#configuring-willautherror
//   // But it's not the case for now, we login with Auth0, outside graphql.
//   // And if graphql can send unauthenticated requests (public routes), we also need to check it.
//   // Alternative: omit willAuthError and let the API decide with a 401.
//   return isJwtLikelyExpired(authState?.accessTokenDecoded);
// };
