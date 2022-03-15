import './core/theme/global.scss';

import { StrictMode } from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import { App } from './App';
import { PreviewMode } from './core/dev-preview-mode/PreviewMode';
import { store } from './core/redux/store';

render(
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
  document.getElementById('react-page'),
);
