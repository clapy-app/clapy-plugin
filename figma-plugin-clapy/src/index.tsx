import './core/theme/global.scss';

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import { App } from './App';
import { PreviewMode } from './core/dev-preview-mode/PreviewMode';
import { store } from './core/redux/store';

// Cast to any because typings don't recognize createRoot yet, despite the addition of src/typings/react-18.d.ts.
const root = (ReactDOM as any).createRoot(document.getElementById('react-page'));

root.render(
  <StrictMode>
    <Provider store={store}>
      {/* Initializes Apollo GraphQL client for child components */}
      {/* Adding Apollo adds >100ko (before gzip)! It's a lot, so we just use the HTTP endpoint as long as we don't need subscriptions. */}
      {/* <InitApolloProvider> */}
      <PreviewMode>
        <App />
      </PreviewMode>
      {/* </InitApolloProvider> */}
    </Provider>
  </StrictMode>,
);
