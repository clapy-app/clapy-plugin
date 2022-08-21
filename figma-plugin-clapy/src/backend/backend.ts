import { initRoutes, initSubscriptions } from './core/initRoutes';
import { routes, subscriptions } from './routes';
import { showUI } from './routes/9-common/load-ui';

try {
  figma.skipInvisibleInstanceChildren = false;

  showUI();

  initRoutes(routes);
  initSubscriptions(subscriptions);
} catch (error) {
  console.error('Error when initializing the plugin:', error);
  throw error;
}
