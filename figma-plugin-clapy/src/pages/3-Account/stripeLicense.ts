import { openNewTab } from '../../common/front-utils.js';
import { apiGet } from '../../common/http.utils.js';
import { env } from '../../environment/env.js';

export const upgradeUser = async () => {
  const { data } = await apiGet('stripe/checkout', { query: { from: env.isFigmaPlugin ? 'desktop' : 'browser' } });
  openNewTab(data as string);
};

export const openCustomerPortal = async () => {
  const { data } = await apiGet<string | undefined>('stripe/customer-portal', {
    query: { from: env.isFigmaPlugin ? 'desktop' : 'browser' },
  });
  if (data) {
    openNewTab(data);
  }
};
