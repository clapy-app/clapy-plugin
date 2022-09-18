import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';
import type { PreviewResp } from '../../common/app-models.js';
import type { UserSettings } from '../../common/sb-serialize.model.js';
import { UserSettingsTarget } from '../../common/sb-serialize.model.js';

import type { RootState } from '../../core/redux/store';
import { getDefaultUserSettings } from './export-code-utils.js';

export interface ExportCodeState {
  selection?: PreviewResp;
  initialLoadingSettings: boolean; // Initial loading - don't use for other purposes
  loading?: boolean;
  // Default user settings are defined in
  // src/pages/2-export-code/export-code-utils.ts#getDefaultUserSettings
  userSettings?: UserSettings;
}

export interface UserSettingPayload<T extends keyof UserSettings = keyof UserSettings> {
  name: T;
  value: UserSettings[T];
}

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
      state.userSettings = payload || getDefaultUserSettings();
    },
    setUserSettingRedux: (state, { payload }: PayloadAction<UserSettings>) => {
      if (!state.userSettings) state.userSettings = {};
      Object.assign(state.userSettings, payload);
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
export const selectSelectionPreviewError = (state: RootState) => state.exportCode.selection?.error;
export const selectSelectionPage = (state: RootState) => state.exportCode.selection?.page;

export const selectIsLoadingUserSettings = (state: RootState) => state.exportCode.initialLoadingSettings;
export const selectUserSettings = (state: RootState) => state.exportCode.userSettings;
export const selectCodeGenIsLoading = (state: RootState) => !!state.exportCode.loading;

export const selectIsGitHubReady = (state: RootState) =>
  !!(
    state.github.credentials?.accessToken &&
    state.github.credentials?.hasPermission &&
    state.github.settings?.repository &&
    state.github.settings?.codegenBranch &&
    state.github.settings?.mergeToBranch
  );
export const selectIsCodeGenReady = (state: RootState) =>
  !!(
    (state.exportCode.userSettings?.target !== UserSettingsTarget.github || selectIsGitHubReady(state)) &&
    (!selectIsAngular(state) || state.exportCode.userSettings?.angularPrefix) &&
    state.exportCode.userSettings?.componentsDir
  );

export const selectPageSetting = (state: RootState) => state.exportCode.userSettings?.page;
export const selectViewportSizeSetting = (state: RootState) => state.exportCode.userSettings?.viewportSize;
export const selectTargetSetting = (state: RootState) => state.exportCode.userSettings?.target;
export const selectFrameworkSetting = (state: RootState) => state.exportCode.userSettings?.framework;
export const selectScssSetting = (state: RootState) => state.exportCode.userSettings?.scss;
export const selectBemSetting = (state: RootState) => state.exportCode.userSettings?.bem;
export const selectCustomCssSetting = (state: RootState) => state.exportCode.userSettings?.customCss;
export const selectAngularPrefixSetting = (state: RootState) => state.exportCode.userSettings?.angularPrefix;
export const selectIsAngular = (state: RootState) => state.exportCode.userSettings?.framework === 'angular';
export const selectComponentsDirSetting = (state: RootState) => state.exportCode.userSettings?.componentsDir;
