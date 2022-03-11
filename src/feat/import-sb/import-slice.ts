import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ArgTypeUsed, SbAnySelection } from '../../common/app-models';
import { Args } from '../../common/sb-serialize.model';
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

// Undefined when the selection is not a componentSet (no variants).
export const selectStoryArgFilters = createSelector(selectSelectionGuaranteed, selection =>
  propArrayToMap(selection.props),
);

export const selectStoryId = createSelector(selectSelectionGuaranteed, sel => sel.storyId);
export const selectFigmaId = createSelector(selectSelectionGuaranteed, sel => sel.figmaId);
export const selectPageId = createSelector(selectSelectionGuaranteed, sel => sel.pageId);
export const selectArgTypes = createSelector(selectSelectionGuaranteed, sel => sel.argTypes);
export const selectInitialArgs = createSelector(selectSelectionGuaranteed, sel => sel.initialArgs as Args);

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
