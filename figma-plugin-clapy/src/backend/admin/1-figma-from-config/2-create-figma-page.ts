//-------------------------------------------------------------------------------------------------------------
//-------------------------------main functions that calls the others--------------------------------

import type { GenerationHistory } from '../../../common/sb-serialize.model.js';
import { generateNode } from './3-create-parent-nodes.js';
import { generateComponents } from './4-create-child-nodes.js';
import type { FigmaConfigContext } from './utils.js';

//-------------------------------------------------------------------------------------------------------------
export async function createPage(generationHistoryEntry: GenerationHistory, ctx: FigmaConfigContext, page?: PageNode) {
  if (!generationHistoryEntry.figmaConfig || !generationHistoryEntry.figmaConfig.root) {
    throw new Error('config or root of config are falsy, there was probably a problem during the config generation.');
  }

  if (!page) {
    page = figma.createPage();
    page.name = generationHistoryEntry.id;
  } else {
    page.children.forEach(e => e.remove());
  }
  ctx.configPage = page;

  if (ctx.components && ctx.components.length > 0) {
    generateComponents(page, ctx);
  }
  ctx.isRoot = true;
  generateNode(page, generationHistoryEntry.figmaConfig.root, ctx);
}
