import { initRoutes, initSubscriptions } from './core/initRoutes';
import { routes, subscriptions } from './routes';
import { showUI } from './routes/9-common/load-ui';

figma.skipInvisibleInstanceChildren = false;

showUI();

initRoutes(routes);
initSubscriptions(subscriptions);
