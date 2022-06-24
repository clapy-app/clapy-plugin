import fs from 'fs';

import { Analytic, init, User, Users } from './shared-variables';

const calculateUserInfoFromAnalytics = (analytics: Analytic[], user: User) => {
  const filtredAnalyticsOpened = analytics.filter(analytic => analytic.Action === 'open-plugin');
  const filtredAnalyticsGenStarted = analytics.filter(
    analytic => analytic.Status == 'start' && analytic.Action == 'gen-code',
  );
  const filtredAnalyticsCompleted = analytics.filter(
    analytic => analytic.Status == 'completed' && analytic.Action == 'gen-code',
  );

  user.numberOfCodeGenerations = filtredAnalyticsCompleted.length;

  if (filtredAnalyticsOpened.length > 0) {
    user.lastTimePluginWasLunched = filtredAnalyticsOpened[filtredAnalyticsOpened.length - 1]['Created At']
      .toISOString()
      .substring(0, 10);
  }
  if (filtredAnalyticsCompleted.length > 0) {
    user.lastTimeCodeWasGenerated = filtredAnalyticsCompleted[filtredAnalyticsCompleted.length - 1]['Created At']
      .toISOString()
      .substring(0, 10);
  }
  if (filtredAnalyticsGenStarted.length > 0 && filtredAnalyticsCompleted.length > 0) {
    user.totalTimeCodeGenerationWasInterrupted = filtredAnalyticsGenStarted.length - filtredAnalyticsCompleted.length;
  }
  for (let i = 0; i < filtredAnalyticsCompleted.length; i++) {
    const datesUserWasOn = filtredAnalyticsCompleted.map(r => r['Created At'].toISOString().substring(0, 10));
    user.numberOfDaysActive = new Set(datesUserWasOn).size;
  }
  if (Array.isArray(user.generatedUrls)) {
    user.generatedUrls = user.generatedUrls.join(';');
  }
};

export async function mainAnalytics() {
  const analytics = await init();
  let users: Users = {};

  // loop through analytics prepare users Variable.
  for (const analytic of analytics) {
    const { 'Auth0 ID': auth0Id } = analytic;
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
