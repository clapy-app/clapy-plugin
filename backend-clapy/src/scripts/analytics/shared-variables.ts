import { readdir } from 'fs/promises';

import { backendDir } from '../../root';

export interface Dict<T = any> {
  [key: string | number | symbol]: T;
}

export interface Analytic {
  ID: string; //'281ff4d8-d7f7-4a0e-a141-7b8c39ce7b44'
  'Created At': Date; // '2022-03-21T18:19:12.970267Z'
  'Figma ID': string; //'1052925304380947491'
  Action: 'close-plugin' | 'gen-code' | 'open-plugin' | 'openPlugin' | 'run-import';
  Status: 'start' | 'interrupt' | 'completed' | 'error';
  Details: { durationInS?: number; error?: any; url?: string }; // '{"durationInS": 84.529}'
  'Auth0 ID': string; // 'google-oauth2|109910128238249032368'
}
export type Users = Dict<User>;

export const excludedUsers = new Set([
  'auth0|auth0|62470e767a2519006fd72d9c',
  'auth0|auth0|6255796ec0f77100691facc9',
  'auth0|62630ca164005300707bc0b8',
  'auth0|62665f2bab55c7006aeaec89',
]);

export interface User {
  key: string;
  analytics: Analytic[];
  numberOfCodeGenerations?: number;
  numberOfDaysActive?: number;
  totalTimeCodeGenerationWasInterrupted?: number;
  lastTimeCodeWasGenerated?: Date | string;
  lastTimePluginWasLunched?: Date | string;
  generatedUrls?: string[] | string;
}
export async function firstJsonFile(directory: string) {
  const files = await readdir(directory);
  for (const file of files) {
    if (file.endsWith('.json')) {
      return file;
    }
  }
  throw new Error(`No JSON file in ${directory}`);
}

export function sortObjectByKey<T = any>(unordered: T): T {
  const sortedKeys = Object.keys(unordered).sort();
  const ordered = sortedKeys.reduce<T>((obj: T, key) => {
    const k = key as unknown as keyof T;
    obj[k] = unordered[k];
    return obj;
  }, {} as T) as unknown as T;
  return ordered;
}
export function dateDiffInDays(a: Date, b: Date) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

export function prepareData(analytics: Analytic[]) {
  for (const analytic of analytics) {
    try {
      // Details is initially a string that we unserialize.
      if (analytic.Details) {
        analytic.Details = JSON.parse(analytic.Details as unknown as string);
      }
      // Created At: string to Date
      if (analytic['Created At']) {
        analytic['Created At'] = new Date(analytic['Created At'] as unknown as string);
      }
    } catch (error) {
      console.error('Invalid Details:');
      console.error(analytic.Details);
    }
  }
}
export async function initAnalytics() {
  const analyticsDirInSrc = `${backendDir}/src/scripts/analytics`;
  const jsonFile = await firstJsonFile(analyticsDirInSrc);
  const jsonPath = `${analyticsDirInSrc}/${jsonFile}`;

  const analytics: Analytic[] = require(jsonPath);
  prepareData(analytics);
  return analytics;
}
