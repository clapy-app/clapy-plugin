import type { GenerationHistory } from '../../../common/sb-serialize.model.js';
import { createPage } from './2-create-figma-page.js';
import type { FigmaConfigContext } from './utils.js';
import { cleanUpLastLaunch } from './utils.js';

export function generateConfig(figmaConfig: GenerationHistory[]) {
  cleanUpLastLaunch();
  for (const config of figmaConfig) {
    const context: FigmaConfigContext = {
      svgs: config.figmaConfig?.svgs,
    };

    createPage(config, context);
  }
}
