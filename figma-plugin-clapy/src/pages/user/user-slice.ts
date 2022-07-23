import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { UserMetadata, UserMetaUsage } from '../../common/app-models.js';
import type { RootState } from '../../core/redux/store';
import { hasMissingMetaProfile, hasMissingMetaUsage } from './user-service';

export interface UserState {
  userMetadata?: UserMetadata;
}

const initialState: UserState = {};

// To add to src/core/redux/store.ts
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setMetadata: (state, { payload }: PayloadAction<UserMetadata | undefined>) => {
      state.userMetadata = payload || {};
    },
    setMetaProfile: (state, { payload }: PayloadAction<UserMetadata>) => {
      const { firstName, lastName, companyName, jobRole, techTeamSize } = payload;
      state.userMetadata = { ...state.userMetadata, firstName, lastName, companyName, jobRole, techTeamSize };
    },
    setMetaUsage: (state, { payload }: PayloadAction<UserMetaUsage>) => {
      if (!state.userMetadata) state.userMetadata = {};
      state.userMetadata.usage = payload;
    },
    clearMetadata: state => {
      state.userMetadata = undefined;
    },
  },
});

export const { setMetadata, setMetaProfile, setMetaUsage, clearMetadata } = userSlice.actions;

/**
 * Not undefined, which assumes the value is read after the authentication initial loading is completed
 * (selectAuthLoading === false)
 */
export const selectUserMetadata = (state: RootState) => state.user.userMetadata!;
export const selectUserMetaUsage = (state: RootState) => state.user.userMetadata?.usage;
export const selectHasMissingMetaProfile = (state: RootState) => hasMissingMetaProfile(state.user.userMetadata);
export const selectHasMissingMetaUsage = (state: RootState) => hasMissingMetaUsage(state.user.userMetadata?.usage);
