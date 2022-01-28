import { isLayout, isText } from './canvas-utils';
import { StoryObj } from './import-model';

export type StoryEntry = [string, StoryObj];
export type StoryEntries = StoryEntry[];

export function getLayoutCompKeyOrUndef(node: SceneNode) {
  if (isLayout(node)) {
    const match = /(.*?)\[sb:c:([^\]]+)\]/g.exec(node.name);
    return [match?.[1]?.trim(), match?.[2]?.trim()];
  }
  return [undefined, undefined];
}

export interface RectangleCreated {
  figmaId: string;
  url: string;
}

export function createRectangles(stories: StoryEntries, baseUrl: string) {
  const nodes: RectangleNode[] = [];
  const response: RectangleCreated[] = [];

  for (let i = 0; i < stories.length; i++) {
    const [storyId, story] = stories[i];
    const rect = getOrCreateCompRectangle(figma.currentPage, storyId, i);
    const name = `${story.title || story.kind} ${story.name || story.story}`;
    rect.name = `${name} [sb:c:${storyId}]`;
    nodes.push(rect);
    const url = `${baseUrl}/iframe.html?id=${storyId}&viewMode=story`;
    response.push({
      figmaId: rect.id,
      url,
    });
  }

  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
  return response;
}

function getOrCreateCompRectangle(page: PageNode, key: string, i: number) {
  for (const node of page.children) {
    const [_, thisNodeKey] = getLayoutCompKeyOrUndef(node);
    if (thisNodeKey === key) {
      return node as RectangleNode;
    }
  }
  const rect = figma.createRectangle();
  rect.y = 100;
  rect.x = i * 550;
  rect.resize(500, 300);
  rect.fills = [{ type: "SOLID", color: { r: 0, g: 0.4, b: 0.8 } }];
  figma.currentPage.appendChild(rect);
  return rect;
}

export function getOrCreatePage() {
  for (const p of figma.root.children) {
    if (p.name.includes('[sb]')) {
      return p;
    }
  }
  const page = figma.createPage();
  page.name = 'Design System [sb]';
  return page;
}

export async function updateOrCreateSbUrlNode(page: PageNode, url: string) {
  const node = getOrCreateSbUrlNode(page);
  await figma.loadFontAsync(<FontName>node.fontName);
  node.characters = url;
  return node;
}

function getOrCreateSbUrlNode(page: PageNode) {
  for (const node of page.children) {
    if (isText(node) && node.name.includes('[sb:url]')) {
      return node;
    }
  }
  const node = figma.createText();
  node.name = 'Storybook URL [sb:url]';
  // figma.currentPage.appendChild(node);
  return node;
}

export function getSbUrlNode(page: PageNode) {
  for (const node of page.children) {
    if (isText(node) && node.name.includes('[sb:url]')) {
      return node;
    }
  }
  // throw new Error('Text element giving Storybook URL not found');
  return undefined;
}
