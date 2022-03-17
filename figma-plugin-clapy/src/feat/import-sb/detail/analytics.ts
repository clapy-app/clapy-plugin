// import { gql } from '@apollo/client';

import { Clapy_Analytics } from '../../../../generated/schema';
import { handleError } from '../../../common/error-utils';
import { fetchPlugin } from '../../../common/plugin-utils';
import { httpPostUnauthenticated } from '../../../common/unauthenticated-http.utils';
import { env } from '../../../environment/env';
import { getAuth0Id } from '../../auth/auth-service';

// export const PUSH_EVENT = gql`
//   mutation ($object: clapy_analytics_insert_input!) {
//     insert_clapy_analytics(objects: [$object]) {
//       affected_rows
//     }
//   }
// `;

export async function pushEvent(action: string, result?: string) {
  try {
    const auth0Id = await getAuth0Id();
    const currentUser = await fetchPlugin('getCurrentUser');
    // In theory, currentUser.id is never empty and should contain an auto-generated ID for the current user.
    // The typing also covers the case of other users (not the current user, with multiple users on the doc).
    // Let's play it safe and cover all cases, falling back to currentUser.name that should contain "Anonymous" if no ID.
    const figmaId = currentUser?.id || currentUser?.name;
    const entry: Partial<Clapy_Analytics> = { figma_id: figmaId, auth0_id: auth0Id, action, result };

    const url = `${env.hasuraRest}/insert_clapy_analytics`;
    await httpPostUnauthenticated(url, { object: entry });
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
