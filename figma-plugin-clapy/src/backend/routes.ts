import { getSbCompSelection, selectedSbComp } from './routes/1-import-stories/1-select-node';
import { detachPage, getStoriesSamples, importStories } from './routes/1-import-stories/2-import-sb-routes';
import { commitUndo, updateCanvas } from './routes/2-update-canvas/1-update-canvas';
import { updateCanvasVariant } from './routes/2-update-canvas/2-update-canvas-variant';
import { runGrid } from './routes/2-update-canvas/grid-utils';
import { updateVariantsFromFilters } from './routes/3-properties/1-update-variants-from-filters';
import { getCurrentUser } from './routes/4-analytics/get-current-user';
import { selectionPreview } from './routes/5-export-code/1-selection-preview';
import { serializeSelectedNode } from './routes/5-export-code/2-serialize-node';
import { clearCachedTokens, getCachedToken, getRefreshToken, setCachedToken } from './routes/getCachedToken';

export const routes = {
  // Auth routes
  getCachedToken: getCachedToken,
  setCachedToken: setCachedToken,
  getRefreshToken: getRefreshToken,
  clearCachedTokens: clearCachedTokens,

  closePlugin: () => figma.closePlugin(),

  // Import storybook
  getSbCompSelection: getSbCompSelection,
  getStoriesSamples: getStoriesSamples,
  importStories: importStories,
  detachPage: detachPage,
  updateCanvas: updateCanvas,
  updateCanvasVariant: updateCanvasVariant,
  commitUndo: commitUndo,

  updateVariantsFromFilters: updateVariantsFromFilters,

  getCurrentUser: getCurrentUser,

  runGrid: runGrid,

  serializeSelectedNode: serializeSelectedNode,
};

export const subscriptions = {
  selectedSbComp: selectedSbComp,
  selectionPreview: selectionPreview,
};

// Use Routes from appModels.ts instead, which is clearly made to be shared between the front and the back.
export type _Routes = typeof routes;
export type _Subscriptions = typeof subscriptions;
