import { apiGet, apiPost } from '../../common/http.utils';
import { dispatchOther, readSelectorOnce } from '../../core/redux/redux.utils';
import { clearMetadata, selectUserMetadata, setMetadata } from './user-slice';

export interface UserMetadata {
  firstName: string;
  lastName: string;
  companyName: string;
  jobTitle: string;
  techTeamSize: string;
}

export async function findUserMetadata() {
  let metadata = readSelectorOnce(selectUserMetadata);
  if (!metadata) {
    metadata = (await apiGet<UserMetadata>('user' /* , { noLogout: true } */)).data;
    dispatchOther(setMetadata(metadata));
  }
  return metadata;
}

export async function updateUserMetadata(metadata: UserMetadata) {
  const res = (await apiPost('user/update-metadata', metadata /* , { noLogout: true } */)).data;
  dispatchOther(setMetadata(metadata));
  return res;
}

export function clearUserMetadata() {
  dispatchOther(clearMetadata());
}

export function hasMissingMetadata({ firstName, lastName, companyName, jobTitle, techTeamSize } = {} as UserMetadata) {
  return !firstName || !lastName || !companyName || !jobTitle || !techTeamSize;
}
