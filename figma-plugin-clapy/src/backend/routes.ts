import { getSelectionPreview, selectionPreview } from './routes/1-export-code/1-selection-preview';
import { figmaConfigExtractionProgress, serializeSelectedNode } from './routes/1-export-code/2-serialize-node';
import { extractSVGs } from './routes/1-export-code/7-extract-svg.js';
import { extractImages } from './routes/1-export-code/8-extract-images.js';
import { clearCachedTokens, getCachedToken, getRefreshToken, setCachedToken } from './routes/2-user/getCachedToken';
import { getUserMetadata, setUserMetadata, setUserMetaUsage } from './routes/2-user/user-cache.js';
import { getCurrentUser } from './routes/9-common/get-current-user';
import { reloadUI } from './routes/9-common/load-ui';
import { getSbCompSelection, selectedSbComp } from './routes/code-to-design/1-import-stories/1-select-node';
import {
  detachPage,
  getStoriesSamples,
  importStories,
} from './routes/code-to-design/1-import-stories/2-import-sb-routes';
import { commitUndo, updateCanvas } from './routes/code-to-design/2-update-canvas/1-update-canvas.js';
import { updateCanvasVariant } from './routes/code-to-design/2-update-canvas/2-update-canvas-variant.js';
import { runGrid } from './routes/code-to-design/2-update-canvas/grid-utils.js';
import { updateVariantsFromFilters } from './routes/code-to-design/3-properties/1-update-variants-from-filters.js';

export const routes = {
  // Common
  reloadUI,
  closePlugin: () => figma.closePlugin(),
  getCurrentUser,

  // User and auth routes
  getCachedToken,
  setCachedToken,
  getRefreshToken,
  clearCachedTokens,
  getUserMetadata,
  setUserMetadata,
  setUserMetaUsage,

  // Design to code: generate code
  getSelectionPreview,
  serializeSelectedNode,
  extractSVGs,
  extractImages,

  // Code to design (old)
  getSbCompSelection,
  getStoriesSamples,
  importStories,
  detachPage,
  updateCanvas,
  updateCanvasVariant,
  commitUndo,

  updateVariantsFromFilters,

  runGrid,
};

export const subscriptions = {
  selectedSbComp: selectedSbComp,
  selectionPreview: selectionPreview,
  figmaConfigExtractionProgress: figmaConfigExtractionProgress,
};

// Use Routes from appModels.ts instead, which is clearly made to be shared between the front and the back.
export type _Routes = typeof routes;
export type _Subscriptions = typeof subscriptions;
