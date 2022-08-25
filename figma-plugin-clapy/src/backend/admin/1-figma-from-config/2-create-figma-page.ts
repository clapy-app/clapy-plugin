//-------------------------------------------------------------------------------------------------------------
//-------------------------------main functions that calls the others--------------------------------

import type { GenerationHistory } from '../../../common/sb-serialize.model.js';
import { generateNode } from './3-create-parent-nodes.js';
import type { FigmaConfigContext } from './utils.js';

//-------------------------------------------------------------------------------------------------------------
export async function createPage(GenerationHistoryEntry: GenerationHistory, ctx: FigmaConfigContext) {
  const newPage = figma.createPage();
  newPage.name = GenerationHistoryEntry.auth0id + ' ' + Math.floor(Math.random() * 100);
  if (!GenerationHistoryEntry.figmaConfig) {
    return;
  }
  generateNode(newPage, GenerationHistoryEntry.figmaConfig, ctx);
}
