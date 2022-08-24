//-------------------------------------------------------------------------------------------------------------
//-------------------------------main functions that calls the others--------------------------------

import { generateNode } from './3-create-parent-nodes.js';

//-------------------------------------------------------------------------------------------------------------
export async function createPage(figmaConfig: any) {
  const newPage = figma.createPage();
  newPage.name = 'test ' + Math.random() * 100;
  generateNode(newPage, figmaConfig);
}
