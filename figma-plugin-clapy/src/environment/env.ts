const nodeEnv = process.env.NODE_ENV;
const isNodeProduction = nodeEnv === 'production';

const appEnv = process.env.APP_ENV;
const envLabel = appEnv && appEnv.toLowerCase();
const isDev = envLabel === 'dev' || envLabel === 'development';
const isStaging = envLabel === 'staging';
const isProd = envLabel === 'prod' || envLabel === 'production';
if (!isDev && !isStaging && !isProd) {
  throw new Error(`Invalid environment found: ${appEnv}`);
}

// Add here non-confidential environment-based configurations (e.g. domains, base URLs)
const dev = {
  apiBaseUrl: 'http://localhost:4141',
};

const staging = {
  apiBaseUrl: 'todo',
};

const prod = {
  apiBaseUrl: 'https://clapy-backend-loitgf2s5q-ew.a.run.app',
};

const nonConfidentialEnv = isDev ? dev : isStaging ? staging : prod;

// cast as string because we check them below and throw if undefined. So it's safe in the rest of the app.
const auth0Domain = process.env.REACT_APP_AUTH0_DOMAIN as string;
const auth0ClientId = process.env.REACT_APP_AUTH0_CLIENT_ID as string;

const isSsl = isTrue(process.env.REACT_APP_HASURA_SSL);
const hasuraPort = `${process.env.REACT_APP_HASURA_PORT || ''}`;
const portFragment =
  !hasuraPort || (isSsl && hasuraPort === '443') || (!isSsl && hasuraPort === '80') ? '' : `:${hasuraPort}`;
const hasuraHttp = `${isSsl ? 'https' : 'http'}://${process.env.REACT_APP_HASURA_HOSTNAME}${portFragment}`;
const hasuraWs = `${isSsl ? 'wss' : 'ws'}://${process.env.REACT_APP_HASURA_HOSTNAME}${portFragment}`;

export const env = {
  ...nonConfidentialEnv,
  auth0Domain,
  auth0ClientId,
  isDev,
  isStaging,
  isProd,
  isJest: typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined,
  nodeEnv,
  isNodeProduction,
  auth0Audience: 'clapy',
  securityRequestedByHeader: 'clapy',
  allowCorsApi: false,
  // Hasura
  hasuraHttp,
  hasuraRest: `${hasuraHttp}/api/rest`,
  hasuraWs,
};

if (!isProd) {
  console.log('Environment:', env);
}

const requiredObj = { auth0Domain, auth0ClientId };
const missing: string[] = [];
for (const [varName, value] of Object.entries(requiredObj)) {
  if (!value) {
    missing.push(varName);
  }
}
if (missing.length) {
  throw new Error(`Missing environment variables. Keys in env: ${missing.join(', ')}`);
}

// export const rawProcessEnv = process.env;

function isTrue(value: boolean | string | undefined) {
  return value === true || value === 'true';
}
