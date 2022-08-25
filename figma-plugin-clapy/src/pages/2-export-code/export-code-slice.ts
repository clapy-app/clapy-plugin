import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';
import type { PreviewResp } from '../../common/app-models.js';

import type { RootState } from '../../core/redux/store';

export interface ExportCodeState {
  selection?: PreviewResp;
}

const initialState: ExportCodeState = {};

// To add to src/core/redux/store.ts
export const exportCodeSlice = createSlice({
  name: 'exportCode',
  initialState,
  reducers: {
    setSelection: (state, { payload }: PayloadAction<PreviewResp>) => {
      state.selection = payload as WritableDraft<PreviewResp>;
    },
  },
});

export const { setSelection } = exportCodeSlice.actions;

export const selectSelectionPreview = (state: RootState) => state.exportCode.selection?.preview;
export const selectSelectionPage = (state: RootState) => state.exportCode.selection?.page;
