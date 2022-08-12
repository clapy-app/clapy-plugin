export {};
// Dependencies: @apollo/client, graphql, subscriptions-transport-ws
// Optional dependency: @apollo/react-common

// import { ApolloClient, ApolloProvider, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
// import { FC, memo, useEffect, useMemo, useRef } from 'react';
// import { SubscriptionClient } from 'subscriptions-transport-ws';

// import { env } from '../../environment/env';

// /**
//  * Don't use unless you know what you are doing. In most cases, you should use useApolloClient() hook instead.
//  * @private
//  */
// export let _apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

// export const InitApolloProvider: FC = memo(function InitApolloProvider({ children }) {
//   // The commented code here is from another app that doesn't want to create the ApolloProvider as long as the user is not authenticated.
//   // An alternative is to recreate the client each time the authentication state changes (see InitApolloProvider2), which may be required if:
//   // - we need apollo before signing in (e.g. analytics),
//   // - and we shouldn't refresh the pages after signing in/out.

//   // // Check when auth0 has finished its initialization
//   // const { isLoading, isAuthenticated } = useAuth0();
//   // const initRef = useRef(false);
//   // if (!initRef.current && !isLoading) {
//   //   initRef.current = true;
//   // }
//   // const isAuth0Initialized = initRef.current;

//   // // As long as auth0 is initializing, we show a loader
//   // if (!isAuth0Initialized) return <Loading />;

//   // if (isAuthenticated) {
//   return <InitApolloProvider2>{children}</InitApolloProvider2>;
//   // }
//   // return <>{children}</>;
// });

// const InitApolloProvider2: FC = memo(function InitApolloProvider2({ children }) {
//   // This code attempts to close the websocket connection in case of sign out.
//   // It is nice to have since a sign out is typically followed by a page refresh.
//   // const { isAuthenticated } = useAuth0();
//   // const store = useStore();
//   const subRef = useRef<SubscriptionClient>();
//   useEffect(
//     () => {
//       // if (!isAuthenticated && subRef.current) {
//       //   console.log('Close websocket connections because of sign out');
//       //   // sub.current.unsubscribeAll();
//       //   subRef.current.close();
//       //   // sub.current = undefined;
//       // }
//       return () => {
//         if (subRef.current) {
//           console.log('Close websocket connections because of InitApolloProvider2 unmount');
//           // eslint-disable-next-line react-hooks/exhaustive-deps
//           subRef.current?.close();
//         }
//       };
//     },
//     [
//       /* isAuthenticated */
//     ],
//   );

//   // Later, we could recreate the client when the authentication state changes.
//   const client = useMemo(
//     () => {
//       _apolloClient = createApolloClient(/* subRef, store */);
//       return _apolloClient;
//     },
//     [
//       /* store */
//     ],
//   );
//   return <ApolloProvider client={client}>{children}</ApolloProvider>;
// });

// function createApolloClient(/* subRef: MutableRefObject<SubscriptionClient | undefined>, store: Store */) {
//   // const wsLink = new WebSocketLink({
//   //   uri: `${env.hasuraWs}/graphql`,
//   //   options: {
//   //     reconnect: true,
//   //     timeout: 5000,
//   //     // lazy: true, // Wait for first subscription to open the ws connection
//   //     // Uncomment below to authenticate the request (for websocket, during the initial handshake).
//   //     // connectionParams: async () => ({ headers: { Authorization: `Bearer ${await getToken()}` } }),
//   //     connectionCallback: (error: any, result?: any) => {
//   //       if (error) handleError(error);
//   //     },
//   //   },
//   // });

//   // // Required to close the connection (above commented code)
//   // subRef.current?.close();
//   // subRef.current = (wsLink as any).subscriptionClient;
//   // if (!subRef.current) throw new Error('subscriptionClient falsy; this is not supposed to happen.');

//   // Older code for inspiration if we want to listen to websocket events:
//   // const subscriptionClient = sub.current;
//   // subscriptionClient.onConnecting(() => console.log('onConnecting'));
//   // subscriptionClient.onConnected(() => console.log('onConnected'));
//   // subscriptionClient.onReconnecting(() => console.log('onReconnecting'));
//   // subscriptionClient.onReconnected(() => console.log('onReconnected'));
//   // subscriptionClient.onDisconnected(() => console.log('onDisconnected'));
//   // subscriptionClient.onError((val: any) => console.log('onError', val));

//   return new ApolloClient({
//     // link: from([makeReduxLink(store), wsLink]),

//     // Let's keep it simple and use HTTP as long as we just need to push analytics (mutations).
//     // When we want to subscribe, we can move to websocket (config above) instead.
//     uri: `${env.hasuraHttp}/graphql`,

//     cache: new InMemoryCache({ addTypename: true }),
//     connectToDevTools: env.isDev,
//   });
// }
