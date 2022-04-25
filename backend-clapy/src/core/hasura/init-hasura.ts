import { ApolloClient, InMemoryCache } from '@apollo/client';

import { env } from '../../env-and-config/env';

export const apolloClient = createApolloClient();

function createApolloClient() {
  return new ApolloClient({
    // Super simple config. If we need something more elaborated, templates are available on the front or other projects.
    uri: `${env.hasuraHttp}/v1/graphql`,

    cache: new InMemoryCache({ addTypename: true }),
    connectToDevTools: env.isDev,
  });
}
