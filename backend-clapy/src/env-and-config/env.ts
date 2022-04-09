import { rootDir } from '../root';

const nodeEnv = process.env.NODE_ENV;
const isNodeProduction = nodeEnv === 'production';
if (!isNodeProduction) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: `${rootDir}/.env` });
}

const envLabel = process.env.APP_ENV && process.env.APP_ENV.toLowerCase();
const isDev = envLabel === 'dev' || envLabel === 'development';
const isStaging = envLabel === 'staging';
const isProd = envLabel === 'prod' || envLabel === 'production';
if (!isDev && !isStaging && !isProd) {
  throw new Error(`Invalid environment found: ${process.env.APP_ENV}`);
}

// Add here non-confidential environment-based configurations (e.g. domains, base URLs)
const dev = {
  auth0Domain: 'clapy.eu.auth0.com',
  auth0ClientId: '6erPCh883JBV4COxwAHLbhbgNgarqaq5',
  baseUrl: 'http://localhost:4141',
};

const staging = {
  auth0Domain: 'clapy.eu.auth0.com',
  auth0ClientId: '6erPCh883JBV4COxwAHLbhbgNgarqaq5',
  baseUrl: 'todo',
};

const prod = {
  auth0Domain: 'clapy.eu.auth0.com',
  auth0ClientId: '6erPCh883JBV4COxwAHLbhbgNgarqaq5',
  baseUrl: 'https://clapy-backend-loitgf2s5q-ew.a.run.app',
};

const nonConfidentialEnv = isDev ? dev : isStaging ? staging : prod;

const isSsl = isTrue(process.env.REACT_APP_HASURA_SSL);
const hasuraPort = `${process.env.REACT_APP_HASURA_PORT || ''}`;
const portFragment =
  !hasuraPort || (isSsl && hasuraPort === '443') || (!isSsl && hasuraPort === '80') ? '' : `:${hasuraPort}`;
const hasuraHttp = `${isSsl ? 'https' : 'http'}://${process.env.REACT_APP_HASURA_HOSTNAME}${portFragment}`;

export const env = {
  ...nonConfidentialEnv,
  isDev,
  isStaging,
  isProd,
  isJest: process.env.JEST_WORKER_ID !== undefined,
  isDocker: process.env.ISDOCKER === 'true',
  nodeEnv: nodeEnv,
  isNodeProduction,
  port: process.env.PORT || '4141',
  auth0Audience: 'clapy',
  securityRequestedByHeader: 'clapy',
  localhostLatency: 400, // ms
  // Hasura
  hasuraAdminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET as string,
  hasuraHttp,
};

// variables in criticalVariables are cast to string (above) to remove `undefined` from the typing, which is safe with the guard below stopping the app if the values are missing.
const criticalVariables: Array<keyof typeof env> = [];
if (isDev) {
  criticalVariables.push('hasuraAdminSecret');
}
// To check process.env.VARNAME when not written in `env` object.
const criticalRawVariables: Array<any> = [];
if (isDev) {
  criticalRawVariables.push('REACT_APP_HASURA_SSL', 'REACT_APP_HASURA_HOSTNAME', 'REACT_APP_HASURA_PORT');
}

const missingVar: Array<keyof typeof env> = [];
for (const key of criticalVariables) {
  if (!env[key]) {
    missingVar.push(key);
  }
}
for (const key of criticalRawVariables) {
  if (!process.env[key]) {
    missingVar.push(key);
  }
}

// if (!isProd) {
//   console.log('Environment:', JSON.stringify(env));
// }
console.log('Loaded environment variables.');

if (missingVar.length) {
  throw new Error(`Missing environment variables. Keys in env.ts: ${missingVar.join(', ')}`);
}

function isTrue(value: boolean | string | undefined) {
  return value === true || value === 'true';
}

export const rawProcessEnv = process.env;
