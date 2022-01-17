import { createRectangles } from './routes/createRectangles';
import { getCachedToken, getRefreshToken, setCachedToken } from './routes/getCachedToken';


export const routes = {
  createRectangles: createRectangles,
  getCachedToken: getCachedToken,
  setCachedToken: setCachedToken,
  getRefreshToken: getRefreshToken,
  closePlugin: () => figma.closePlugin(),
};