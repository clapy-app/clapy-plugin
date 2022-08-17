import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { App } from './App';
import { PreviewMode } from './core/dev-preview-mode/PreviewMode';
import { InitGqlProvider } from './core/hasura/init-hasura.js';
import { store } from './core/redux/store';
import './resets.css';

const root = createRoot(document.getElementById('react-page') as HTMLElement);
root.render(
  <StrictMode>
    <Provider store={store}>
      <InitGqlProvider>
        {/* Initializes Apollo GraphQL client for child components */}
        {/* Adding Apollo adds >100ko (before gzip)! It's a lot, so we just use the HTTP endpoint as long as we don't need subscriptions. */}
        {/* <InitApolloProvider> */}
        <PreviewMode>
          <App />
        </PreviewMode>
        {/* </InitApolloProvider> */}
      </InitGqlProvider>
    </Provider>
  </StrictMode>,
);
