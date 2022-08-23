import { generateConfig } from './admin/1-figma-from-config/1-read-figma-config.js';
import {
  getSelectionCustomCss,
  getSelectionPreview,
  saveCustomCssInFigmaNode,
  selectionCustomCss,
  selectionPreview,
} from './routes/1-export-code/1-selection-ops';
import { figmaConfigExtractionProgress, serializeSelectedNode } from './routes/1-export-code/2-serialize-node';
import { extractSVGs } from './routes/1-export-code/7-extract-svg.js';
import { extractImages } from './routes/1-export-code/8-extract-images.js';
import {
  clearCachedTokens,
  getCachedIsFirstLogin,
  getCachedToken,
  getGithubCachedToken,
  getRefreshToken,
  setCachedIsFirstLogin,
  setCachedToken,
  setGithubCachedToken,
} from './routes/2-user/getCachedToken';
import { getUserMetadata, setUserMetadata, setUserMetaUsage } from './routes/2-user/user-cache.js';
import { getCurrentUser } from './routes/9-common/get-current-user';
import { reloadUI } from './routes/9-common/load-ui';
import { notifyReady } from './routes/9-common/notify-ready.js';

export const routes = {
  // Common
  notifyReady,
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
  getGithubCachedToken,
  setGithubCachedToken,

  // Design to code: generate code
  getSelectionPreview,
  saveCustomCssInFigmaNode,
  getSelectionCustomCss,
  serializeSelectedNode,
  extractSVGs,
  extractImages,

  // admin
  generateConfig,

  // To delete in a few weeks. flag related to news update toast that shows on first login of user.
  setCachedIsFirstLogin,
  getCachedIsFirstLogin,

  // Code to design (old)
  //   getSbCompSelection,
  //   getStoriesSamples,
  //   importStories,
  //   detachPage,
  //   updateCanvas,
  //   updateCanvasVariant,
  //   commitUndo,
  //
  //   updateVariantsFromFilters,
  //
  //   runGrid,
};

// Possible refactoring: subscription functions could return the callback function and change the "next" to be called without any argument.
// Benefit: the engine could call the function itself. Strong typing should still be possible.
// => When subscribing, the callback would be initially called, so that the front doesn't need to call a separate route just to get the initial value (e.g. existing selection). The code would be much simpler. Example:
// useEffect(subscribePlugin('selectionCustomCss', (error, customCss) => {
//   // ...
// }), []);
// We could even make a useSubscribePlugin:
// useSubscribePlugin('selectionCustomCss', (error, customCss) => {
//   // ...
// });
export const subscriptions = {
  selectionPreview,
  selectionCustomCss,
  figmaConfigExtractionProgress,

  // Code to design (old)
  // selectedSbComp,
};

// Use Routes from appModels.ts instead, which is clearly made to be shared between the front and the back.
export type _Routes = typeof routes;
export type _Subscriptions = typeof subscriptions;
