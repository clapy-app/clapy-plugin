import { createRectangles } from './routes/createRectangles';
import { clearCachedTokens, getCachedToken, getRefreshToken, setCachedToken } from './routes/getCachedToken';


export const routes = {
  createRectangles: createRectangles,
  getCachedToken: getCachedToken,
  setCachedToken: setCachedToken,
  getRefreshToken: getRefreshToken,
  clearCachedTokens: clearCachedTokens,
  closePlugin: () => figma.closePlugin(),
};