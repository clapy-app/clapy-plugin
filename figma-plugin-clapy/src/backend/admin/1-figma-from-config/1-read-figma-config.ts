import { createPage } from './2-create-figma-page.js';
import { cleanUpLastLaunch } from './utils.js';

export function generateConfig(figmaConfig: any) {
  cleanUpLastLaunch();
  for (const config of figmaConfig) {
    createPage(config.figmaConfig);
  }
}
