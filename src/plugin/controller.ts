import { initRoutes } from './core/initRoutes';
import { createRectangles } from './createRectangles';
import { getCachedToken, setCachedToken } from './getCachedToken';

figma.showUI(__html__);
figma.ui.resize(400, 300);

const routes = {
  createRectangles,
  getCachedToken,
  setCachedToken,
  closePlugin: () => figma.closePlugin(),
};

// Use Routes from appModels.ts instead, which is clearly made to be shared between the front and the back.
export type CtrlRoutes = typeof routes;

initRoutes(routes);
