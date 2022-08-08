import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '../../core/redux/store';

export interface ExportCodeState {
  selection?: string | false;
}

const initialState: ExportCodeState = {};

// To add to src/core/redux/store.ts
export const exportCodeSlice = createSlice({
  name: 'exportCode',
  initialState,
  reducers: {
    setSelection: (state, { payload }: PayloadAction<string | false | undefined>) => {
      state.selection = payload;
    },
  },
});

export const { setSelection } = exportCodeSlice.actions;

export const selectSelection = (state: RootState) => state.exportCode.selection;
