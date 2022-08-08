import { env } from '../../environment/env.js';
import { openNewTab, toastError } from '../../front-utils/front-utils.js';
import { apiGet } from '../../front-utils/http.utils.js';

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
  } else {
    toastError("We couldn't open your customer portal. Please contact us to resolve this issue.");
  }
};
