//-------------------------------------------------------------------------------------------------------------
//-------------------------------main functions that calls the others--------------------------------

import type { FigmaConfigContext } from './1-read-figma-config.js';
import { generateNode } from './3-create-parent-nodes.js';

//-------------------------------------------------------------------------------------------------------------
export async function createPage(figmaConfig: any, ctx: FigmaConfigContext) {
  const newPage = figma.createPage();
  newPage.name = 'test ' + Math.random() * 100;
  generateNode(newPage, figmaConfig, ctx);
}
