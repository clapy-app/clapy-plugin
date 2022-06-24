import { Analytic, dateDiffInDays, Dict, excludedUsers, init, sortObjectByKey } from './shared-variables';

(async function main() {
  const analytics = await init();

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
})();
