import { NextFn } from '../../common/app-models';
import { SelectedTextNode } from '../../common/text-node-models';

// routes

export async function createText(text: string) {
  const newTextNode = figma.createText();
  await figma.loadFontAsync(<FontName>newTextNode.fontName);
  newTextNode.characters = text;
  newTextNode.name = 'Sample Text';

  figma.currentPage.appendChild(newTextNode);
  figma.currentPage.selection = [newTextNode];
  figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
  sendTextSelection?.();
}

export async function updateText(figmaNodeID: string, text: string) {
  const textNode = <TextNode>figma.getNodeById(figmaNodeID);
  await figma.loadFontAsync(<FontName>textNode.fontName);
  textNode.characters = text;
  sendTextSelection?.();
}

export async function getText() {
  sendTextSelection?.();
}

// Subscription

let sendTextSelection: (() => void) | undefined;

export function selectedTextNodes(next: NextFn<SelectedTextNode[]>) {
  sendTextSelection = () => next(getSelectedNodes());
  figma.on("selectionchange", sendTextSelection);
}

// Internal

function getSelectedNodes() {
  const selectedTextNodes = (figma.currentPage.selection as TextNode[])
    .filter(node => node.type === 'TEXT')
    .map((node: TextNode) => ({ figmaNodeID: node.id, text: node.characters }));
  return selectedTextNodes;
}
