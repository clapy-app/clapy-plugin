import { StrictMode } from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { App } from './App';
import { PreviewMode } from './core/dev-preview-mode/PreviewMode';
import { store } from './core/redux/store';
import './core/theme/global.scss';

render(
  <StrictMode>
    <PreviewMode>
      <Provider store={store}>
        <App />
      </Provider>
    </PreviewMode>
  </StrictMode>
  , document.getElementById('react-page'));
