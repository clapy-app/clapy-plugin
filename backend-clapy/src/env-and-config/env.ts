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
  auth0Domain: 'aol-perso.eu.auth0.com',
  auth0ClientId: 'UacC8wcgdrZyVtPU71J1SNqTuEN8rLe9',
  baseUrl: 'http://localhost:4141',
};

const staging = {
  auth0Domain: 'aol-perso.eu.auth0.com',
  auth0ClientId: 'UacC8wcgdrZyVtPU71J1SNqTuEN8rLe9',
  baseUrl: 'http://localhost:4141',
};

const prod = {
  auth0Domain: 'aol-perso.eu.auth0.com',
  auth0ClientId: 'UacC8wcgdrZyVtPU71J1SNqTuEN8rLe9',
  baseUrl: 'http://localhost:4141',
};

const nonConfidentialEnv = isDev ? dev : isStaging ? staging : prod;

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
  hasuraHttp: `${isTrue(process.env.REACT_APP_HASURA_SSL) ? 'https' : 'http'}://${
    process.env.REACT_APP_HASURA_HOSTNAME
  }:${process.env.REACT_APP_HASURA_PORT}/v1`,
};

// variables in criticalVariables are cast to string (above) to remove `undefined` from the typing, which is safe with the guard below stopping the app if the values are missing.
const criticalVariables: Array<keyof typeof env> = ['hasuraAdminSecret'];
// To check process.env.VARNAME when not written in `env` object.
const criticalRawVariables: Array<any> = ['REACT_APP_HASURA_SSL', 'REACT_APP_HASURA_HOSTNAME', 'REACT_APP_HASURA_PORT'];

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

if (!isProd) {
  console.log('Environment:', JSON.stringify(env));
}

if (missingVar.length) {
  throw new Error(`Missing environment variables. Keys in env.ts: ${missingVar.join(', ')}`);
}

function isTrue(value: boolean | string | undefined) {
  return value === true || value === 'true';
}

export const rawProcessEnv = process.env;