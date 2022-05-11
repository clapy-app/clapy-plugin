import { UpdateMode } from '../types/state';

type WindowSettingsType = {
  width: number;
  height: number;
};

type TokenModeType = 'object' | 'array';

export interface SettingsState {
  uiWindow?: WindowSettingsType;
  updateMode: UpdateMode;
  updateRemote: boolean;
  updateOnChange?: boolean;
  updateStyles?: boolean;
  tokenType?: TokenModeType;
  ignoreFirstPartForStyles?: boolean;
  inspectDeep: boolean;
}

export type BackgroundJob = {
  name: string;
  isInfinite?: boolean;
  timePerTask?: number;
  completedTasks?: number;
  totalTasks?: number;
};
