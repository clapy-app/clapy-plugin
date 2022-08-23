import { env } from '../environment/env.js';
import { getFigmaSelection } from './common/selection-utils.js';
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

if (env.isDev) {
  figma.on('selectionchange', logSelection);
  logSelection();

  function logSelection() {
    const selection = getFigmaSelection();
    if (!selection) {
      return undefined;
    }
    const date = new Date().toISOString().substring(0, 19).replace('T', ' ');
    console.log(date, selection.name, `figma.getNodeById('${selection.id}')`, '=>', selection);
  }
}
