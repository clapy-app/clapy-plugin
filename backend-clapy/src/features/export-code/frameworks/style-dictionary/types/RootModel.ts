import type { inspectState } from '@/app/store/models/inspectState';
import type { settings } from '@/app/store/models/settings';
import type { tokenState } from '@/app/store/models/tokenState';
import type { uiState } from '@/app/store/models/uiState';
import type { Models } from '@rematch/core';

export interface RootModel extends Models<RootModel> {
  settings: typeof settings;
  uiState: typeof uiState;
  tokenState: typeof tokenState;
  inspectState: typeof inspectState;
}
