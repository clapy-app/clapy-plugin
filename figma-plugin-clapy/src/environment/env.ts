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

const isBack = typeof window === 'undefined';
export const isFigmaPlugin = !isBack && window.location.origin === 'null';

// Add here non-confidential environment-based configurations (e.g. domains, base URLs)
const dev = {
  apiBaseUrl: 'http://localhost:4141',
  // apiBaseUrl: 'https://clapy-backend-loitgf2s5q-ew.a.run.app',
  githubOAuthAppUrl: 'https://github.com/settings/connections/applications/793511a7b2d41b3cfe5a',
};

const staging = {
  apiBaseUrl: 'todo',
  githubOAuthAppUrl: 'todo',
};

const prod = {
  apiBaseUrl: 'https://clapy-backend-loitgf2s5q-ew.a.run.app',
  githubOAuthAppUrl: 'https://github.com/settings/connections/applications/517bbefccc493f4e427c',
};

const nonConfidentialEnv = isDev ? dev : isStaging ? staging : prod;

const previewEnv = process.env.PREVIEW_ENV;

// cast as string because we check them below and throw if undefined. So it's safe in the rest of the app.
const auth0Domain = process.env.VITE_AUTH0_DOMAIN as string;
const auth0ClientId = process.env.VITE_AUTH0_CLIENT_ID as string;

const isSsl = isTrue(process.env.VITE_HASURA_SSL);
const hasuraPort = `${process.env.VITE_HASURA_PORT || ''}`;
const portFragment =
  !hasuraPort || (isSsl && hasuraPort === '443') || (!isSsl && hasuraPort === '80') ? '' : `:${hasuraPort}`;
const hasuraAfterProtocol = `://${process.env.VITE_HASURA_HOSTNAME}${portFragment}`;
const hasuraHttp = `${isSsl ? 'https' : 'http'}${hasuraAfterProtocol}`;
const hasuraWs = `${isSsl ? 'wss' : 'ws'}${hasuraAfterProtocol}`;

export const env = {
  ...nonConfidentialEnv,
  auth0Domain,
  auth0ClientId,
  isDev,
  isStaging,
  isProd,
  isJest: typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined,
  isFigmaPlugin,
  previewEnv,
  isPreviewInBrowser: previewEnv === 'browser',
  isPreviewInFigma: previewEnv === 'figma',
  nodeEnv,
  isNodeProduction,
  auth0Audience: 'clapy',
  securityRequestedByHeader: 'clapy',
  allowCorsApi: false,
  // Hasura
  hasuraGraphQL: `${hasuraHttp}/v1/graphql`,
  hasuraGraphQLWS: `${hasuraWs}/v1/graphql`,
  hasuraRest: `${hasuraHttp}/api/rest`,
};

if (!isProd) {
  console.log(`Environment (${isBack ? 'plugin back' : isFigmaPlugin ? 'plugin UI' : 'browser'}):`, env);
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
