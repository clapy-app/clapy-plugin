import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from '../../core/redux/store';
import { hasMissingMetadata, UserMetadata } from './user-service';

export interface UserState {
  userMetadata?: UserMetadata;
}

const initialState: UserState = {};

// To add to src/core/redux/store.ts
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setMetadata: (state, { payload }: PayloadAction<UserMetadata>) => {
      state.userMetadata = payload;
    },
    clearMetadata: state => {
      state.userMetadata = undefined;
    },
  },
});

export const { setMetadata, clearMetadata } = userSlice.actions;

export const selectUserMetadata = (state: RootState) => state.user.userMetadata;
export const selectHasMissingMetadata = (state: RootState) => hasMissingMetadata(state.user.userMetadata);
