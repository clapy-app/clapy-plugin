import { clearCachedTokens, getCachedToken, getRefreshToken, setCachedToken } from './routes/getCachedToken';
import { detachPage, getSbCompSelection, getStoriesSamples, importStories, selectedSbComp } from './routes/import-sb/import-sb-routes';
import { updateCanvas } from "./routes/import-sb/update-canvas";
import { updateCanvasVariant } from './routes/import-sb/update-canvas-variant';
import { runGrid } from './routes/import-sb/update-canvas/grid-utils';
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
  getStoriesSamples: getStoriesSamples,
  importStories: importStories,
  detachPage: detachPage,
  getSbCompSelection: getSbCompSelection,
  updateCanvas: updateCanvas,
  updateCanvasVariant: updateCanvasVariant,

  runGrid: runGrid,
};

export const subscriptions = {
  selectedTextNodes: selectedTextNodes,
  selectedSbComp: selectedSbComp,
};

// Use Routes from appModels.ts instead, which is clearly made to be shared between the front and the back.
export type _Routes = typeof routes;
export type _Subscriptions = typeof subscriptions;
