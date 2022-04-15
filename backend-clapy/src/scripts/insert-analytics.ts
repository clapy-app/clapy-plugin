import axios from 'axios';
import { readFile } from 'fs/promises';

import '../env-and-config/env';
import { backendDir } from '../root';

// Script to migrate analytics data from a database to another, each having a hasura instance in front of it.
// Usage:
// - Add HASURA_STAGING_ADMIN_SECRET on .env (root of repository) with the hasura admin secret of the target hasura instance, then rerun docker-compose to ensure the new .env is loaded in the container.
// - Export the data as json from the source hasura instance through its console.
// - Check and update below config variables (isSsl, hasuraHost, hasuraPort) to point to the target hasura instance
// - Call insertTrackings()
// - Check on the target hasura instance that entries have been inserted

// Config
const isSsl = true;
const hasuraHost = 'hasura-loitgf2s5q-ew.a.run.app';
const hasuraPort = undefined; // e.g. '8080'
const analyticsExportFilePath = `${backendDir}/src/scripts/export_clapy_analytics.json`;
// Also add HASURA_STAGING_ADMIN_SECRET to .env file.

export async function insertTrackings() {
  try {
    console.log(process.env.APP_ENV);
    if (!process.env.HASURA_STAGING_ADMIN_SECRET) {
      throw new Error(
        'Please add HASURA_STAGING_ADMIN_SECRET to the .env file at the root of the repository before starting this script.',
      );
    }

    // Prepare URL
    const portFragment =
      // @ts-ignore
      !hasuraPort || (isSsl && hasuraPort === '443') || (!isSsl && hasuraPort === '80') ? '' : `:${hasuraPort}`;
    const hasuraHttp = `${isSsl ? 'https' : 'http'}://${hasuraHost}${portFragment}`;
    const hasuraRest = `${hasuraHttp}/api/rest`;
    const url = `${hasuraRest}/insert_clapy_analytics`;
    const hasuraAdminSecret = process.env.HASURA_STAGING_ADMIN_SECRET;

    const entries = await loadTrackingsToInsert();
    for (const entry of entries) {
      await insertTracking(entry, url, hasuraAdminSecret);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const { message, name, response } = error;
      const { data, status, statusText } = response || {};
      console.error(name, status, ':', statusText, '-', message, '- response data:');
      console.error(data);
    } else {
      console.error(error);
    }
  }
}

async function insertTracking(entry: Clapy_Analytics, url: string, hasuraAdminSecret: string) {
  try {
    await axios.post(
      url,
      { object: entry },
      {
        headers: {
          'x-hasura-admin-secret': hasuraAdminSecret,
        },
      },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const { response } = error;
      const { data } = response || {};
      if (data?.code === 'constraint-violation') {
        console.log('Skipping existing analytic log', entry.id);
        return;
      }
    }
    throw error;
  }
}

async function loadTrackingsToInsert() {
  const rawContent = await readFile(analyticsExportFilePath, { encoding: 'utf-8' });
  const entries = JSON.parse(rawContent);
  // Example:
  // const entries: Clapy_Analytics[] = [
  //   {
  //     id: 'ceb94e05-5c64-45a6-8170-1996baca979a',
  //     created_at: '2022-03-18T09:23:22.453269+00:00',
  //     figma_id: '1055066184869682343',
  //     auth0_id: 'auth0|622f597dc4b56e0071615ebe',
  //     action: 'run-import',
  //     status: 'start',
  //     details: { url: 'https://reactstrap.github.io' },
  //   },
  // ];
  return entries;
}

type Maybe<T> = T | null;
type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  timestamptz: any;
  jsonb: any;
  uuid: any;
};
type Clapy_Analytics = {
  __typename?: 'clapy_analytics';
  action: Scalars['String'];
  auth0_id?: Maybe<Scalars['String']>;
  created_at: Scalars['timestamptz'];
  details?: Maybe<Scalars['jsonb']>;
  figma_id: Scalars['String'];
  id: Scalars['uuid'];
  status?: Maybe<Scalars['String']>;
};
