import type { Client as WSClient } from 'graphql-ws';
import type { FC, PropsWithChildren } from 'react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Provider } from 'urql';

import { selectSignedIn } from '../auth/auth-slice.js';
import { mkGqlClient } from './init-hasura-gql-client.js';
import { mkWSClient } from './init-hasura-ws-client.js';

export const InitGqlProvider: FC<PropsWithChildren<{}>> = memo(function InitGqlProvider({ children }) {
  const isSignedIn = useSelector(selectSignedIn);
  const wsClientRef = useRef<WSClient>();
  const gqlClient = useMemo(() => {
    wsClientRef.current?.dispose();
    wsClientRef.current = mkWSClient();
    return mkGqlClient(wsClientRef.current);
  }, []);

  useEffect(() => {
    if (!wsClientRef.current) {
      console.warn('WebSocket client not defined! Is there an issue with the chronology?');
      return;
    }
    if (isSignedIn) {
    } else {
      wsClientRef.current.terminate();
    }
  }, [isSignedIn]);

  return <Provider value={gqlClient}>{children}</Provider>;
});
