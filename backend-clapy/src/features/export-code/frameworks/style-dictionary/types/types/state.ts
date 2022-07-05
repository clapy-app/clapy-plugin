import type { ApiDataType, StorageType } from './api.js';
import type { Tokens } from './tokens';

export type StateType = {
  storageType: StorageType;
  tokens: Tokens;
  loading: boolean;
  disabled: boolean;
  collapsed: boolean;
  selectionValues: object;
  api: ApiDataType;
  apiProviders: ApiDataType[];
  updatePageOnly: boolean;
  editProhibited: boolean;
  usedTokenSet: string[];
};

export enum UpdateMode {
  PAGE = 'page',
  DOCUMENT = 'document',
  SELECTION = 'selection',
}
