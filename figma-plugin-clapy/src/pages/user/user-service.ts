import type { Dispatch } from '@reduxjs/toolkit';
import equal from 'fast-deep-equal';
import { AsYouType } from 'libphonenumber-js';

import type { UserMetadata, UserMetaUsage, UserProfileState } from '../../common/app-models.js';
import { fetchPlugin } from '../../common/plugin-utils.js';
import { dispatchOther, readSelectorOnce } from '../../core/redux/redux.utils';
import { apiGet, apiPost } from '../../front-utils/http.utils.js';
import { clearMetadata, selectUserProfileState, setMetadata, setMetaProfile, setMetaUsage } from './user-slice';

export async function dispatchLocalUserMetadata(signedInState: boolean) {
  let metadata: UserProfileState = readSelectorOnce(selectUserProfileState);
  if (metadata) return metadata;
  const userProfileState = await fetchPlugin('getUserMetadata');
  if (signedInState && !userProfileState) {
    await fetchUserMetadata();
  } else {
    dispatchOther(setMetadata(userProfileState));
  }
}

export async function fetchUserMetadata() {
  const metadata = (await apiGet<UserMetadata>('user', { _readCachedTokenNoFetch: true })).data;
  const localMetadata: UserProfileState = readSelectorOnce(selectUserProfileState);
  if (!equal(metadata, localMetadata)) {
    dispatchOther(setMetadata(metadata));
    await saveUserMetadataInCache(metadata);
  }
}

export async function updateUserMetadata(metadata: UserMetadata, dispatch: Dispatch) {
  metadata = { ...metadata };
  await apiPost('user/update-profile', metadata);
  dispatch(setMetaProfile(metadata));
  await saveUserMetadataInCache(metadata);
}

async function saveUserMetadataInCache(metadata: UserMetadata) {
  const metaToSave = hasMissingMetaProfile(metadata) || hasMissingMetaUsage(metadata.usage) ? metadata : true;
  await fetchPlugin('setUserMetadata', metaToSave);
}

export async function updateUserMetaUsage(metaUsage: UserMetaUsage, dispatch: Dispatch) {
  metaUsage = { ...metaUsage };
  if (!metaUsage.other && metaUsage.otherDetail) {
    delete metaUsage.otherDetail;
  }
  await apiPost('user/update-usage', metaUsage);
  dispatch(setMetaUsage(metaUsage));
  await fetchPlugin('setUserMetaUsage' /* , metaUsage */);
}

export function clearLocalUserMetadata() {
  dispatchOther(clearMetadata());
}

// Ensure this method is synced with the backend equivalent: backend-clapy/src/features/user/user.service.ts
export function hasMissingMetaProfile(
  { firstName, lastName, companyName, jobRole, phone, techTeamSize } = {} as UserMetadata,
) {
  // if the company name is provided, we don't ask for the phone number.
  // This could change in the future, if we always want a phone number.
  return !firstName || !lastName || (!phone && !companyName) || !jobRole || !techTeamSize;
}

// Ensure this method is synced with the backend equivalent: backend-clapy/src/features/user/user.service.ts
export function hasMissingMetaUsage(userMetaUsage: UserMetaUsage | undefined) {
  const { components, designSystem, landingPages, other, otherDetail } = userMetaUsage || {};
  return !components && !designSystem && !landingPages && !(other && otherDetail);
}

const phoneFormatter = new AsYouType();

export function formatPartialPhone<T extends string | undefined>(phone: T) {
  phone = prefixPhone(phone);
  let isValid = false;
  let phoneRaw = phone;
  if (phone) {
    // For a full formatting, we could use parsePhoneNumber(phone).formatInternational() instead.
    // But the formatting is not accurate for partial phones.
    phoneFormatter.reset();
    phone = phoneFormatter.input(phone) as T;
    phoneRaw = phoneFormatter.getNumberValue()?.toString() as T;
    isValid = phoneFormatter.isValid();
  }
  return [phone, isValid, phoneRaw] as const;
}

function prefixPhone<T extends string | undefined>(phone: T) {
  if (phone && !phone.startsWith('+')) {
    phone = `+${phone}` as T;
  }
  return phone;
}
