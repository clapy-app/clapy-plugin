import { createRectangles } from './routes/createRectangles';
import { getCachedToken, setCachedToken } from './routes/getCachedToken';


export const routes = {
  createRectangles: createRectangles,
  getCachedToken: getCachedToken,
  setCachedToken: setCachedToken,
  closePlugin: () => figma.closePlugin(),
};