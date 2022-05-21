function login(username, password, callback) {
  const jwtDecode = require('jwt-decode@3.1.1');

  const auth0Domain = 'aol-perso.eu.auth0.com';
  const url = `https://${auth0Domain}/oauth/token`;
  const body = {
    grant_type: 'password',
    client_id: 'UacC8wcgdrZyVtPU71J1SNqTuEN8rLe9',
    // audience: 'clapy',
    scope: 'openid profile email',
    username,
    password,
  };
  request(
    {
      method: 'POST',
      url,
      body,
      json: true,
    },
    (err, resp, data) => {
      var _err$response, _err$response2, _err$response3, _err$response3$data;

      // First check errors
      if (
        ((err === null || err === void 0
          ? void 0
          : (_err$response = err.response) === null || _err$response === void 0
          ? void 0
          : _err$response.status) === 403 ||
          (err === null || err === void 0
            ? void 0
            : (_err$response2 = err.response) === null || _err$response2 === void 0
            ? void 0
            : _err$response2.status) === 401) &&
        (err === null || err === void 0
          ? void 0
          : (_err$response3 = err.response) === null || _err$response3 === void 0
          ? void 0
          : (_err$response3$data = _err$response3.data) === null || _err$response3$data === void 0
          ? void 0
          : _err$response3$data.error) === 'invalid_grant'
      ) {
        var _err$response4, _err$response4$data;

        return callback(
          new WrongUsernameOrPasswordError(
            username,
            (err === null || err === void 0
              ? void 0
              : (_err$response4 = err.response) === null || _err$response4 === void 0
              ? void 0
              : (_err$response4$data = _err$response4.data) === null || _err$response4$data === void 0
              ? void 0
              : _err$response4$data.error_description) || 'Wrong email or password.',
          ),
        );
      }

      if (err) {
        return callback(err);
      }

      if (resp.statusCode !== 200) {
        return callback(
          new Error(
            `Status is ${resp.statusCode}, not 200: ${
              (err === null || err === void 0 ? void 0 : err.message) ||
              (err === null || err === void 0 ? void 0 : err.stack) ||
              err
            }`,
          ),
        );
      }

      const { access_token, id_token, scope, expires_in, token_type } = data; // nickname : 'antoine.orylamballe'
      // name : 'antoine.orylamballe@gmail.com'
      // picture url
      // iss: 'https://clapy.eu.auth0.com/';
      // sub: 'auth0|622f597dc4b56e0071615ebe',
      // aud: 'UacC8wcgdrZyVtPU71J1SNqTuEN8rLe9',
      // iat: 1649526503,
      // exp: 1649562503

      const { nickname, name, picture, updated_at, email, email_verified, iss, sub, aud, iat, exp } =
        jwtDecode(id_token); // Set the data we want to store in Auth0 and migrate the user

      return callback(null, {
        user_id: sub,
        name,
        nickname,
        picture,
        email: email,
        email_verified,
      });
    },
  );
}

// Above code transpiled with: https://babeljs.io/repl/
// To work on node 12.
// ----------
// Code to test the function. Don't copy-paste.
// ----------
// API: https://auth0.com/docs/api/authentication#user-profile

const req = require;
require = moduleName => {
  return req(moduleName.replace(/@.*/, ''));
};

const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config({
  path: `${__dirname}/../../../../.env`,
});
const testUsername = process.env.AUTH0_TEST_EMAIL;
const testPassword = process.env.AUTH0_TEST_PASSWORD;

(async () => {
  login(testUsername, testPassword, (error, profile) => {
    if (error) {
      console.error(error);
    } else {
      console.log('OK, profile:');
      console.log(profile);
    }
  });
})().catch(err => console.error(err?.response?.data || err?.response || err));

function request({ url, body, method = 'GET', headers = {}, json = false }, callback) {
  if (method !== 'GET' && method !== 'POST') throw new Error(`Unsupported method ${method}`);
  if (json) {
    headers['content-type'] = 'application/json';
  }
  const promise = method === 'GET' ? axios.get(url, { headers }) : axios.post(url, body, { headers });
  promise
    .then(resp => callback(null, Object.assign({}, resp, { statusCode: resp.status }), resp.data))
    .catch(err => callback(err, Object.assign({}, err?.response, { statusCode: err?.response?.status })));
}

class WrongUsernameOrPasswordError extends Error {
  constructor(email, description) {
    super(`${description} - email: ${email}`);
  }
}
