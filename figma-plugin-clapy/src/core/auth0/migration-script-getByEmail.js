function getByEmail(email, callback) {
  const auth0Domain = 'aol-perso.eu.auth0.com';
  const url = `https://${auth0Domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`;
  request(
    {
      method: 'GET',
      url,
      json: true,
      headers: {
        Authorization: `Bearer ${configuration.token}`,
      },
    },
    (err, resp, data) => {
      // First check errors
      if (err) {
        var _err$response;

        return callback(
          err === null || err === void 0
            ? void 0
            : (_err$response = err.response) === null || _err$response === void 0
            ? void 0
            : _err$response.data,
        );
      }

      if (resp.statusCode !== 200) {
        return callback(
          new Error(
            `Status is not 200: ${
              (err === null || err === void 0 ? void 0 : err.message) ||
              (err === null || err === void 0 ? void 0 : err.stack) ||
              err
            }`,
          ),
        );
      }

      if (!(data !== null && data !== void 0 && data.length)) {
        // User not found
        return callback(null);
      }

      const {
        nickname,
        name,
        picture,
        created_at,
        updated_at,
        email,
        email_verified,
        identities,
        user_id,
        last_ip,
        last_login,
        logins_count,
      } = data[0]; // User found, return profile in callback

      callback(null, {
        user_id,
        name,
        nickname,
        identities,
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
// API: https://auth0.com/docs/api/management/v2#!/Users_By_Email/get_users_by_email
// Token generated with: https://manage.auth0.com/dashboard/eu/aol-perso/apis/management/explorer

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
const managementToken = process.env.AUTH0_MGMT_TOKEN;

const configuration = {
  token: managementToken,
};

(async () => {
  getByEmail(testUsername, (error, profile) => {
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
