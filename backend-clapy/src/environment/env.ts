const nodeEnv = process.env.NODE_ENV;
const isNodeProduction = nodeEnv === 'production';
if (!isNodeProduction) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
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
};

if (isDev) {
  console.log('environment:', JSON.stringify(env));
}

export const rawProcessEnv = process.env;
