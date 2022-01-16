import { StrictMode } from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { App } from './App';
import { store } from './core/redux/store';
import './core/theme/global.scss';


render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
  , document.getElementById('react-page'));
