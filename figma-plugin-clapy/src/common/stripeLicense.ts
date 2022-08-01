import { env } from '../environment/env.js';
import { openNewTab } from './front-utils.js';
import { apiGet } from './http.utils.js';

export const upgradeUser = async () => {
  const { data } = await apiGet('stripe/checkout', { query: { from: env.isFigmaPlugin ? 'desktop' : 'browser' } });
  openNewTab(data as string);
};
export const openCustomerPortal = async () => {
  const { data } = await apiGet('stripe/customer-portal', {
    query: { from: env.isFigmaPlugin ? 'desktop' : 'browser' },
  });
  openNewTab(data as string);
};
