import { initRoutes, initSubscriptions } from './core/initRoutes';
import { routes, subscriptions } from './routes';

const isPreviewInFigma = process.env.PREVIEW_ENV === 'figma';

figma.skipInvisibleInstanceChildren = true;

figma.showUI(__html__);
if (isPreviewInFigma) {
  figma.ui.resize(300, 200);
} else {
  // Must match src/core/dev-preview-mode/PreviewMode.module.css
  figma.ui.resize(404, 600);
}

initRoutes(routes);
initSubscriptions(subscriptions);
