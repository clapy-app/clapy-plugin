import { Dispatch } from '@reduxjs/toolkit';

import { apiGet, apiPost } from '../../common/http.utils';
import { dispatchOther, readSelectorOnce } from '../../core/redux/redux.utils';
import { clearMetadata, selectUserMetadata, setMetadata } from './user-slice';

export interface UserMetadata {
  firstName: string;
  lastName: string;
  companyName: string;
  jobRole: string;
  techTeamSize: string;
}

export async function findUserMetadata() {
  let metadata = readSelectorOnce(selectUserMetadata);
  if (!metadata) {
    metadata = (await apiGet<UserMetadata>('user', { _readCachedTokenNoFetch: true })).data;
    dispatchOther(setMetadata(metadata));
  }
  return metadata;
}

export async function updateUserMetadata(metadata: UserMetadata, dispatch: Dispatch) {
  const res = (await apiPost('user/update-metadata', metadata /* , { noLogout: true } */)).data;
  dispatch(setMetadata({ ...metadata }));
  return res;
}

export function clearLocalUserMetadata() {
  dispatchOther(clearMetadata());
}

export function hasMissingMetadata({ firstName, lastName, companyName, jobRole, techTeamSize } = {} as UserMetadata) {
  return !firstName || !lastName || !companyName || !jobRole || !techTeamSize;
}
