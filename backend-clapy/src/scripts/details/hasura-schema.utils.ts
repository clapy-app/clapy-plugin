import { Logger } from '@nestjs/common';
import axios from 'axios';
import { wait } from '../../common/general-utils';
import { env } from '../../env-and-config/env';
import { backendDir, pluginDir } from '../../root';

// Require dev dependencies:
// mkdirp
// graphql-fetch-schema
// @graphql-codegen/cli
// @graphql-codegen/typescript

const rootHasuraUrl = `${env.hasuraHttp}/v1`;

const secret = env.hasuraAdminSecret;
const frontGeneratedDir = `${pluginDir}/generated`;
const apiGeneratedDir = `${backendDir}/generated`;
const logger = new Logger('hasura-schema');

export async function hasuraReloadMetadataAndSchema() {
  logger.log('Reload Hasura metadata...');
  await withRetry(hasuraReloadMetadata);
  // Uncomment if we have remote schema. They should be refreshed as well.
  // await withRetry(hasuraReloadRemoteSchema);
  logger.log('Metadata refreshed.');
}

export async function generateTypes() {
  if (!env.isDev) {
    throw new Error('GraphQL types should only be generated in dev environment.');
  }
  logger.log('Extract Hasura schema and types for front...');
  await createGeneratedFolder();
  await hasuraExtractSchema();
  await generateTypesFromSchema();
  logger.log('Schema and types extracted.');
}

const retryCodes = ['ECONNREFUSED', 'ECONNRESET'];
const retryDelay = 3;

async function withRetry<T>(func: (...args: any[]) => Promise<T>): Promise<T> {
  try {
    return await func();
  } catch (e: any) {
    const connectionFailed = retryCodes.includes(e?.code);
    const inconsistentMetadata =
      e?.response?.data?.error === 'cannot continue due to newly found inconsistent metadata';
    if (connectionFailed || inconsistentMetadata) {
      if (connectionFailed) {
        logger.error(`Couldn't connect to Hasura. Is Hasura container started? Will retry in ${retryDelay} seconds...`);
      } else if (inconsistentMetadata) {
        logger.error(`Couldn't connect to Hasura, inconsistent metadata. Will retry in ${retryDelay} seconds...`);
      }
      await wait(retryDelay * 1000);
      return await withRetry(func);
    } else {
      // tslint:disable-next-line:no-console
      console.warn('Failed with code:', e.code);
      throw e;
    }
  }
}

async function hasuraReloadMetadata() {
  return axios.post(
    `${rootHasuraUrl}/query`,
    {
      type: 'reload_metadata',
      args: {},
    },
    {
      headers: {
        'X-Hasura-Role': 'admin',
        'X-Hasura-Admin-Secret': secret,
      },
    },
  );
}

async function createGeneratedFolder() {
  const mkdirp = require('mkdirp');
  return Promise.all([mkdirp(frontGeneratedDir), mkdirp(apiGeneratedDir)]);
}

async function hasuraExtractSchema() {
  const fetchSchema = require('graphql-fetch-schema').default;
  return Promise.all([
    fetchSchema(`${rootHasuraUrl}/graphql`, {
      json: false,
      graphql: true,
      outputPath: frontGeneratedDir,
      headers: {
        'X-Hasura-Role': 'admin',
        'X-Hasura-Admin-Secret': secret,
      },
    }),
    fetchSchema(`${rootHasuraUrl}/graphql`, {
      json: false,
      graphql: true,
      outputPath: apiGeneratedDir,
      headers: {
        'X-Hasura-Role': 'admin',
        'X-Hasura-Admin-Secret': secret,
      },
    }),
  ]);
}

async function generateTypesFromSchema() {
  const { generate } = require('@graphql-codegen/cli');
  return generate(
    {
      schema: `${frontGeneratedDir}/schema.graphql`,
      // documents: './src/**/*.graphql',
      generates: {
        [`${frontGeneratedDir}/schema.d.ts`]: {
          plugins: ['typescript'],
        },
        [`${apiGeneratedDir}/schema.d.ts`]: {
          plugins: ['typescript'],
        },
      },
      silent: true,
    },
    true,
  );
}
