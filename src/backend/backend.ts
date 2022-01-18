import { initRoutes, initSubscriptions } from './core/initRoutes';
import { routes, subscriptions } from './routes';

const isPreviewInFigma = process.env.PREVIEW_ENV === 'figma';

figma.showUI(__html__);
if (isPreviewInFigma) {
  figma.ui.resize(300, 200);
} else {
  figma.ui.resize(400, 400);
}

// Use Routes from appModels.ts instead, which is clearly made to be shared between the front and the back.
export type _Routes = typeof routes;
export type _Subscriptions = typeof subscriptions;

initRoutes(routes);
initSubscriptions(subscriptions);
