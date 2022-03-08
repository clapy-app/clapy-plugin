import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ArgTypeUsed, SbAnySelection } from '../../common/app-models';
import { RootState } from '../../core/redux/store';

export interface ImportState {
  selections: SbAnySelection[];
}

const initialState: ImportState = { selections: [] };

// To add to src/core/redux/store.ts
export const importSlice = createSlice({
  name: 'import',
  initialState,
  reducers: {
    setSelection: (state, { payload }: PayloadAction<SbAnySelection[]>) => {
      state.selections = payload;
    },
  },
});

export const { setSelection } = importSlice.actions;

export const selectSelections = (state: RootState) => state.import.selections;

// Only use below selectors in PreviewArea or any context where a single selection is guaranteed.
export const selectSelectionGuaranteed = createSelector(selectSelections, selections => {
  if (!selections?.length || selections.length > 1)
    throw new Error('Illegal selector, there must be exactly one selected component');
  return selections[0]!;
});

export const selectPropsObj = createSelector(selectSelectionGuaranteed, selection => propArrayToMap(selection.props));

export const selectStoryId = createSelector(selectSelectionGuaranteed, sel => sel.storyId);

interface ArgTypeObj {
  [key: string]: boolean;
}

export function propArrayToMap(array: ArgTypeUsed[] | undefined) {
  if (!array) return undefined;
  const indexed: ArgTypeObj = {};
  for (const argType of array) {
    indexed[argType.argName] = argType.used;
  }
  return indexed;
}
