// import { gql } from '@apollo/client';
import type { Clapy_Analytics } from '../../generated/schema';
import { _accessTokenDecoded } from '../core/auth/auth-service';
import { env } from '../environment/env';
import { handleError } from '../front-utils/front-utils.js';
import { fetchPlugin } from './plugin-utils';

// export const PUSH_EVENT = gql`
//   mutation ($object: clapy_analytics_insert_input!) {
//     insert_clapy_analytics(objects: [$object]) {
//       affected_rows
//     }
//   }
// `;

let currentUser: User | null = null;

fetchPlugin('getCurrentUser').then(user => {
  currentUser = user;
});

export function track(action: string, status?: string, details?: any) {
  try {
    // fetchPlugin('getCurrentUser').then(user => {
    //   console.log('getCurrentUser2:', user);
    // });
    const auth0Id = _accessTokenDecoded ? _accessTokenDecoded.sub : null;
    // const currentUser = await fetchPlugin('getCurrentUser');
    // In theory, currentUser.id is never empty and should contain an auto-generated ID for the current user.
    // The typing also covers the case of other users (not the current user, with multiple users on the doc).
    // Let's play it safe and cover all cases, falling back to currentUser.name that should contain "Anonymous" if no ID.
    const figmaId = currentUser?.id || currentUser?.name || 'undefined';
    const entry: Partial<Clapy_Analytics> = { figma_id: figmaId, auth0_id: auth0Id, action, status, details };

    const url = `${env.hasuraRest}/insert_clapy_analytics`;
    // await httpPostUnauthenticated(url, { object: entry });
    navigator.sendBeacon(url, JSON.stringify({ object: entry }));
    // const apolloClient = _apolloClient;
    // if (!apolloClient) {
    //   console.warn(
    //     'ApolloClient is not ready yet. Are we pushing analytics too early or something else is wrong? Ignoring in this call. It should be investigated.',
    //   );
    //   // If it's better to handle it, we can use a promise to wait for apollo client, as AOL has done for auth in the past. (2 cases: initial wait until resolved, and newer clients replacing the previous one.)
    //   return;
    // }
    // await apolloClient.mutate({
    //   mutation: PUSH_EVENT,
    //   variables: { object: entry },
    // });
  } catch (e) {
    handleError(e);
  }
}
