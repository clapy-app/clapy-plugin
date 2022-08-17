import { rootDir } from '../root.js';

const nodeEnv = process.env.NODE_ENV;
const isNodeProduction = nodeEnv === 'production';
if (!isNodeProduction) {
  // eslint-disable-next-line prettier/prettier
  const dotenvPkg = await import('dotenv');
  dotenvPkg.config({ path: `${rootDir}/.env` });
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
  auth0Domain: 'clapy-dev.eu.auth0.com',
  auth0ClientId: 'BxwH4Y8N4xsrJp55lm4UTWblnHVDRDz9',
  auth0BackendClientId: 'gTS80LWjCx2pzwWZ0pLyBVK6XD6fVgF3',
  baseUrl: 'http://localhost:4141',
};

const staging = {
  auth0Domain: 'todo',
  auth0ClientId: 'todo',
  auth0BackendClientId: 'todo',
  baseUrl: 'todo',
};

const prod = {
  auth0Domain: 'clapy.eu.auth0.com',
  auth0ClientId: '6erPCh883JBV4COxwAHLbhbgNgarqaq5',
  auth0BackendClientId: 'BSeUsfhXeYXBUSRH1zfsxftkc4e43vj1',
  baseUrl: 'https://clapy-backend-loitgf2s5q-ew.a.run.app',
};

const nonConfidentialEnv = isDev ? dev : isStaging ? staging : prod;

const isSsl = isTrue(process.env.VITE_HASURA_SSL);
const hasuraPort = `${process.env.VITE_HASURA_PORT || ''}`;
const portFragment =
  !hasuraPort || (isSsl && hasuraPort === '443') || (!isSsl && hasuraPort === '80') ? '' : `:${hasuraPort}`;
const hasuraHttp = `${isSsl ? 'https' : 'http'}://${process.env.VITE_HASURA_HOSTNAME}${portFragment}`;

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
  auth0BackendClientSecret: process.env.AUTH0_BACKEND_CLIENT_SECRET as string,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY as string,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
  stripePriceId: process.env.STRIPE_PRICE_ID as string,
  securityRequestedByHeader: 'clapy',
  localhostLatency: 400, // ms
  // Hasura
  hasuraAdminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET as string,
  hasuraHttp,
  // Database
  dbHost: process.env.POSTGRES_HOST as string,
  dbPort: process.env.POSTGRES_PORT_CONSUMER as string,
  dbName: process.env.POSTGRES_DB as string /* 'clapy' */,
  dbUser: process.env.POSTGRES_USER as string,
  dbPassword: process.env.POSTGRES_PASSWORD as string,
  pipedriveApiKey: process.env.PIPEDRIVE_API_KEY as string,
  // Developer opt-in feature, only active in development. See description in .env.example.
  localPreviewInsteadOfCsb: isDev && process.env.LOCAL_PREVIEW_INSTEAD_OF_CSB?.toLowerCase() === 'true',
};

// variables in criticalVariables are cast to string (above) to remove `undefined` from the typing, which is safe with the guard below stopping the app if the values are missing.
const criticalVariables: Array<keyof typeof env> = [
  'dbHost',
  'dbPort',
  'dbName',
  'dbUser',
  'dbPassword',
  'auth0BackendClientSecret',
  'pipedriveApiKey',
];
if (isDev) {
  criticalVariables.push('hasuraAdminSecret');
}
// To check process.env.VARNAME when not written in `env` object.
const criticalRawVariables: Array<any> = [];
if (isDev) {
  criticalRawVariables.push(
    'VITE_HASURA_SSL',
    'VITE_HASURA_HOSTNAME',
    'VITE_HASURA_PORT',
    'AUTH0_BACKEND_CLIENT_SECRET',
    'PIPEDRIVE_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  );
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
