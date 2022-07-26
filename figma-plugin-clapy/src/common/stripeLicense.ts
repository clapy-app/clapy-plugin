import { env } from '../environment/env.js';
import { openNewTab } from './front-utils.js';
import { apiGet } from './http.utils.js';

export const upgradeUser = async () => {
  const { data } = await apiGet('stripe/checkout', { query: { from: env.isFigmaPlugin ? 'desktop' : 'browser' } });
  openNewTab(data as string);
};
export const openCustomerPortal = async () => {
  const { data } = await apiGet('stripe/customerPortal', {
    query: { from: env.isFigmaPlugin ? 'desktop' : 'browser' },
  });
  openNewTab(data as string);
};
export const isUserLicenceStillActive = (licenceExpirationDate: number | undefined) => {
  if (typeof licenceExpirationDate === 'undefined') return false;
  const now = new Date();
  const expirationDate = new Date(licenceExpirationDate * 1000);
  const isExpired = now.getTime() - expirationDate.getTime();
  // console.log('expiration Date: ' + expirationDate.getTime(), 'now date : ' + now.getTime());

  if (isExpired < 0) {
    return true;
  } else {
    return false;
  }
};
