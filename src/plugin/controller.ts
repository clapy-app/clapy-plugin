import { initRoutes } from './core/initRoutes';
import { routes } from './routes';

figma.showUI(__html__);
figma.ui.resize(400, 300);

// Use Routes from appModels.ts instead, which is clearly made to be shared between the front and the back.
export type CtrlRoutes = typeof routes;

initRoutes(routes);
