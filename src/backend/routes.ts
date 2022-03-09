import { getSbCompSelection, selectedSbComp } from './routes/1-import-stories/1-select-node';
import { detachPage, getStoriesSamples, importStories } from './routes/1-import-stories/2-import-sb-routes';
import { updateCanvas } from './routes/2-update-canvas/1-update-canvas';
import { updateCanvasVariant } from './routes/2-update-canvas/2-update-canvas-variant';
import { runGrid } from './routes/2-update-canvas/grid-utils';
import { updateFilters } from './routes/3-properties/1-update-filters';
import { clearCachedTokens, getCachedToken, getRefreshToken, setCachedToken } from './routes/getCachedToken';
import { createText, getText, selectedTextNodes, updateText } from './routes/text-node-routes';

export const routes = {
  // Auth routes
  getCachedToken: getCachedToken,
  setCachedToken: setCachedToken,
  getRefreshToken: getRefreshToken,
  clearCachedTokens: clearCachedTokens,

  closePlugin: () => figma.closePlugin(),

  createText: createText,
  updateText: updateText,
  getText: getText,

  // Import storybook
  getSbCompSelection: getSbCompSelection,
  getStoriesSamples: getStoriesSamples,
  importStories: importStories,
  detachPage: detachPage,
  updateCanvas: updateCanvas,
  updateCanvasVariant: updateCanvasVariant,

  updateFilters: updateFilters,

  runGrid: runGrid,
};

export const subscriptions = {
  selectedTextNodes: selectedTextNodes,
  selectedSbComp: selectedSbComp,
};

// Use Routes from appModels.ts instead, which is clearly made to be shared between the front and the back.
export type _Routes = typeof routes;
export type _Subscriptions = typeof subscriptions;
