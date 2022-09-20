import type { GenerationHistory } from '../../../common/sb-serialize.model.js';
import { createPage } from './2-create-figma-page.js';
import type { FigmaConfigContext } from './utils.js';

export function generateConfig(figmaConfig: GenerationHistory[]) {
  try {
    for (const config of figmaConfig) {
      const context: FigmaConfigContext = {
        svgs: config.figmaConfig?.svgs,
        oldComponentIdsToNewDict: [],
      };

      const existingPageRelatedToConfig = figma.root.children.find(page => page.name === config.id);
      createPage(config, context, existingPageRelatedToConfig);
    }
  } finally {
    figma.commitUndo();
  }
}
