import { readdir } from 'fs/promises';

(async function main() {
  async function firstJsonFile(directory: string) {
    const files = await readdir(directory);
    for (const file of files) {
      if (file.endsWith('.json')) {
        return file;
      }
    }
    throw new Error(`No JSON file in ${directory}`);
  }

  const jsonFile = await firstJsonFile(__dirname);
  const jsonPath = `${__dirname}/${jsonFile}`;

  const analytics: Analytic[] = require(jsonPath);

  const excludedUsers = new Set([
    'auth0|auth0|62470e767a2519006fd72d9c',
    'auth0|auth0|6255796ec0f77100691facc9',
    'auth0|62630ca164005300707bc0b8',
    'auth0|62665f2bab55c7006aeaec89',
  ]);

  // Prepare data in the right model
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

  // Threshold
  const numberOfReuse = 2;
  const now = new Date();

  const perUser: Dict<Analytic[]> = {};
  const perUserAndDate: Dict<Set<string>> = {};
  const yesterdayUsers: Set<string> = new Set();
  const usersPerDate: Dict<Set<string>> = {};

  for (const entry of analytics) {
    const auth0 = entry['Auth0 ID'];

    // Filter: Auth 0 must be filled
    if (!auth0) {
      continue;
    }

    // Filter: remove excluded users
    if (excludedUsers.has(auth0)) {
      continue;
    }

    // Filter: in past 15 days until yesterday only
    const daysDiff = dateDiffInDays(entry['Created At'], now);
    if (daysDiff > 15 || daysDiff < 1) {
      continue;
    }

    // Filter: action is 'gen-code', Status is 'start' (other possible choice for completed: = 'completed')
    if (!(entry.Action === 'gen-code' && entry.Status === 'start')) {
      continue;
    }

    const day = entry['Created At'].toISOString().substring(0, 10);

    // Index by Auth 0 ID
    if (!perUser[auth0]) {
      perUser[auth0] = [];
    }
    perUser[auth0].push(entry);
    // Also index by user and date
    if (!perUserAndDate[auth0]) {
      perUserAndDate[auth0] = new Set();
    }
    perUserAndDate[auth0].add(day);
    // Users grouped by day
    if (!usersPerDate[day]) {
      usersPerDate[day] = new Set();
    }
    usersPerDate[day].add(entry['Auth0 ID']);
  }

  const user = perUser[Object.keys(perUser)[0]][0];
  for (const [day, usersThatDay] of Object.entries(sortObjectByKey(usersPerDate))) {
    console.log('----', day);
    for (const user of usersThatDay) {
      const dates = perUserAndDate[user];
      const dates2 = Array.from(dates).sort();
      const firstDate = dates2[0];
      if (day !== firstDate && dates2.length >= numberOfReuse) {
        console.log(`${user}\t${dates2.length}\t${JSON.stringify(dates2)}`);
      }
    }
  }

  function sortObjectByKey<T = any>(unordered: T): T {
    const sortedKeys = Object.keys(unordered).sort();
    const ordered = sortedKeys.reduce<T>((obj: T, key) => {
      const k = key as unknown as keyof T;
      obj[k] = unordered[k];
      return obj;
    }, {} as T) as unknown as T;
    return ordered;
  }
  // TODO nous filtrer

  // Models and utils

  // a and b are javascript Date objects
  function dateDiffInDays(a: Date, b: Date) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
  }

  interface Dict<T = any> {
    [key: string | number | symbol]: T;
  }

  interface Analytic {
    ID: string; //'281ff4d8-d7f7-4a0e-a141-7b8c39ce7b44'
    'Created At': Date; // '2022-03-21T18:19:12.970267Z'
    'Figma ID': string; //'1052925304380947491'
    Action: 'close-plugin' | 'gen-code' | 'open-plugin' | 'openPlugin' | 'run-import';
    Status: 'start' | 'interrupt' | 'completed' | 'error';
    Details: { durationInS?: number; error?: any; url?: string }; // '{"durationInS": 84.529}'
    'Auth0 ID': string; // 'google-oauth2|109910128238249032368'
  }
})();
