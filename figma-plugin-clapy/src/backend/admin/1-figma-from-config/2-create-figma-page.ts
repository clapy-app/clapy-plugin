//-------------------------------------------------------------------------------------------------------------
//-------------------------------main functions that calls the others--------------------------------

import { generateNode } from './3-create-parent-nodes.js';
import type { FigmaConfigContext } from './utils.js';

//-------------------------------------------------------------------------------------------------------------
export async function createPage(figmaConfig: any, ctx: FigmaConfigContext) {
  const newPage = figma.createPage();
  newPage.name = 'test ' + Math.random() * 100;
  generateNode(newPage, figmaConfig, ctx);
}
