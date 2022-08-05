import type { UserSettings } from '../../../common/sb-serialize.model.js';

export type UserSettingsKeys = keyof UserSettings;
export type UserSettingsValues = NonNullable<UserSettings[UserSettingsKeys]>;
