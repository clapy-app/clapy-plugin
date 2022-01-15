import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/global.scss';

// declare function createAuth0Client(options: any): Promise<any>;
// let auth0 = createAuth0Client({
//   domain: env.auth0Domain,
//   client_id: env.auth0ClientId,
// });
// If auth0 KO here, I'll make my own minimalist token refreshing management, i.e. when I get 401, run the refresh, through the app server if it can help. To investigate after I get answers from Figma slack.


// I tried this lib, it seems KO in Figma plugin: https://www.npmjs.com/package/electron-auth0-login
// (async function () {
//   const auth = auth0Login({
//     // Get these values from your Auth0 application console
//     auth0: {
//       audience: '',
//       clientId: env.auth0ClientId,
//       domain: env.auth0Domain,
//       scopes: ''
//     }
//   });
//   const token = await auth.getToken();
//   console.log('token:', token);
// })().catch(err => console.error(err));

ReactDOM.render(
  // <Auth0Provider
  //   domain={env.auth0Domain}
  //   clientId={env.auth0ClientId}
  //   redirectUri={`${env.apiBaseUrl}/login/callback`}
  // >
  <App />
  // </Auth0Provider>
  , document.getElementById('react-page'));
