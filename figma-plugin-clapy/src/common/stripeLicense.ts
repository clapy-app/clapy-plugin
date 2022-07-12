import { env } from '../environment/env.js';
import { openNewTab } from './front-utils.js';
import { apiGet } from './http.utils.js';

export const upgradeUser = async () => {
  console.log('send request...');
  const { data } = await apiGet('stripe/checkout', { query: { from: env.isFigmaPlugin ? 'desktop' : 'browser' } });
  openNewTab(data as string);
};
