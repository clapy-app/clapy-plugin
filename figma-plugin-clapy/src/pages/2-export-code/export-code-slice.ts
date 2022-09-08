import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';
import type { PreviewResp } from '../../common/app-models.js';
import type { UserSettings } from '../../common/sb-serialize.model.js';
import { UserSettingsTarget } from '../../common/sb-serialize.model.js';

import type { RootState } from '../../core/redux/store';

export interface ExportCodeState {
  selection?: PreviewResp;
  initialLoadingSettings: boolean; // Initial loading - don't use for other purposes
  loading?: boolean;
  userSettings?: UserSettings;
}

export interface UserSettingPayload<T extends keyof UserSettings = keyof UserSettings> {
  name: T;
  value: UserSettings[T];
}

export const defaultUserSettings: UserSettings = {
  framework: 'react',
  target: UserSettingsTarget.csb,
  angularPrefix: 'cl',
};

const initialState: ExportCodeState = {
  initialLoadingSettings: true,
};

// To add to src/core/redux/store.ts
export const exportCodeSlice = createSlice({
  name: 'exportCode',
  initialState,
  reducers: {
    setSelection: (state, { payload }: PayloadAction<PreviewResp>) => {
      state.selection = payload as WritableDraft<PreviewResp>;
    },
    startLoadingUserSettings: state => {
      state.initialLoadingSettings = true;
    },
    endLoadingUserSettings: state => {
      state.initialLoadingSettings = false;
    },
    setUserSettings: (state, { payload }: PayloadAction<UserSettings | undefined>) => {
      state.userSettings = payload || defaultUserSettings;
    },
    setUserSettingRedux: (state, { payload: { name, value } }: PayloadAction<UserSettingPayload>) => {
      (state.userSettings as any)[name] = value;
    },
    setLoading: (state, { payload }: PayloadAction<boolean>) => {
      state.loading = payload;
    },
  },
});

export const {
  setSelection,
  startLoadingUserSettings,
  endLoadingUserSettings,
  setUserSettings,
  setUserSettingRedux,
  setLoading,
} = exportCodeSlice.actions;

export const selectSelectionPreview = (state: RootState) => state.exportCode.selection?.preview;
export const selectSelectionPage = (state: RootState) => state.exportCode.selection?.page;

export const selectIsLoadingUserSettings = (state: RootState) => state.exportCode.initialLoadingSettings;
export const selectUserSettings = (state: RootState) => state.exportCode.userSettings;
export const selectCodeGenIsLoading = (state: RootState) => !!state.exportCode.loading;

export const selectPageSetting = (state: RootState) => state.exportCode.userSettings?.page;
export const selectTargetSetting = (state: RootState) => state.exportCode.userSettings?.target;
export const selectFrameworkSetting = (state: RootState) => state.exportCode.userSettings?.framework;
export const selectScssSetting = (state: RootState) => state.exportCode.userSettings?.scss;
export const selectBemSetting = (state: RootState) => state.exportCode.userSettings?.bem;
export const selectCustomCssSetting = (state: RootState) => state.exportCode.userSettings?.customCss;
export const selectAngularPrefixSetting = (state: RootState) => state.exportCode.userSettings?.angularPrefix;
export const selectIsAngular = (state: RootState) => state.exportCode.userSettings?.framework === 'angular';
