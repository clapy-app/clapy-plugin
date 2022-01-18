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
  auth0Domain: 'aol-perso.eu.auth0.com',
  auth0ClientId: 'UacC8wcgdrZyVtPU71J1SNqTuEN8rLe9',
  apiBaseUrl: 'http://localhost:4141',
};

const staging = {
  auth0Domain: 'aol-perso.eu.auth0.com',
  auth0ClientId: 'UacC8wcgdrZyVtPU71J1SNqTuEN8rLe9',
  apiBaseUrl: 'http://localhost:4141',
};

const prod = {
  auth0Domain: 'aol-perso.eu.auth0.com',
  auth0ClientId: 'UacC8wcgdrZyVtPU71J1SNqTuEN8rLe9',
  apiBaseUrl: 'http://localhost:4141',
};

const nonConfidentialEnv = isDev ? dev : isStaging ? staging : prod;

export const env = {
  ...nonConfidentialEnv,
  isDev,
  isStaging,
  isProd,
  isJest: typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined,
  nodeEnv,
  isNodeProduction,
  auth0Audience: 'clapy',
  securityRequestedByHeader: 'clapy',
  allowCorsApi: false,
};

// export const rawProcessEnv = process.env;
