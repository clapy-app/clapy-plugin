import fs from 'fs';

import type { Analytic, User, Users } from './shared-variables.js';
import { initAnalytics } from './shared-variables.js';

const calculateUserInfoFromAnalytics = (analytics: Analytic[], user: User) => {
  const filteredAnalyticsOpened = analytics.filter(analytic => analytic.Action === 'open-plugin');
  const filteredAnalyticsGenStarted = analytics.filter(
    analytic => analytic.Status == 'start' && analytic.Action == 'gen-code',
  );
  const filteredAnalyticsCompleted = analytics.filter(
    analytic => analytic.Status == 'completed' && analytic.Action == 'gen-code',
  );

  user.numberOfCodeGenerations = filteredAnalyticsCompleted.length;

  if (filteredAnalyticsOpened.length > 0) {
    user.lastTimePluginWasLaunched = filteredAnalyticsOpened[0]['Created At'].toISOString().substring(0, 10);
  }

  if (filteredAnalyticsCompleted.length > 0) {
    user.lastTimeCodeWasGenerated = filteredAnalyticsCompleted[0]['Created At'].toISOString().substring(0, 10);
  }

  if (filteredAnalyticsGenStarted.length > 0 && filteredAnalyticsCompleted.length >= 0) {
    user.totalTimeCodeGenerationWasInterrupted = filteredAnalyticsGenStarted.length - filteredAnalyticsCompleted.length;
  }

  for (let i = 0; i < filteredAnalyticsCompleted.length; i++) {
    const datesUserWasOn = filteredAnalyticsCompleted.map(r => r['Created At'].toISOString().substring(0, 10));
    user.numberOfDaysActive = new Set(datesUserWasOn).size;
  }

  if (Array.isArray(user.generatedUrls)) {
    user.generatedUrls = user.generatedUrls.join(';');
  }
};

export async function mainAnalytics() {
  const analytics = await initAnalytics();
  let users: Users = {};

  // loop through analytics prepare users Variable.
  for (const analytic of analytics) {
    const { 'Auth0 ID': auth0Id } = analytic;
    if (auth0Id == null) continue;
    if (!users[auth0Id]) {
      users[auth0Id] = {
        key: auth0Id,
        analytics: [],
      };
    }
    users[auth0Id].analytics.push(analytic);
  }

  for (const user of Object.values(users)) {
    user.generatedUrls = Object.values(user.analytics)
      .filter(analytic => analytic.Details?.url)
      .map(analytic => analytic.Details.url!);
    calculateUserInfoFromAnalytics(user.analytics, user);
  }
  const dictstring = JSON.stringify(users);
  fs.writeFile('user-data.json', dictstring, e => {
    console.log(e);
  });
}
mainAnalytics();
