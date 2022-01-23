import { NextFn, SbCompSelection } from '../../../common/app-models';
import { SbSelection, StoriesObj, storiesSamples, StoryObj } from './import-model';

export function getStoriesSamples() {
  const samples = Object.entries(storiesSamples).map(([key, entry]) => [key as SbSelection, entry.label] as const);
  return samples;
}

type StoryEntry = [string, StoryObj];
type StoryEntries = StoryEntry[];

export async function importStories(sbSelection: SbSelection) {
  const { stories: storiesWrapper, baseUrl } = storiesSamples[sbSelection];
  const stories: StoryEntries = Object.entries(storiesWrapper.stories as StoriesObj)
    // Alternative: filter on !story.parameters.docsOnly
    .filter(([_, story]) => story.parameters.__isArgsStory)
    .slice(0, 3)
    ;

  const page = getOrCreatePage();
  figma.currentPage = page;

  await updateOrCreateSbUrlNode(page, baseUrl);

  createRectangles(stories);
}


export async function getSbCompSelection() {
  sendSbCompSelection?.();
}

// Subscription

let sendSbCompSelection: (() => void) | undefined;

export function selectedSbComp(next: NextFn<SbCompSelection[]>) {
  sendSbCompSelection = () => next(prepareSbCompSelection());
  figma.on("selectionchange", sendSbCompSelection);
}

function prepareSbCompSelection(): SbCompSelection[] {
  const sbUrlNode = getSbUrlNode(figma.currentPage);
  const baseUrl = sbUrlNode.characters;

  const selectedSbComp = (figma.currentPage.selection)
    .reduce((selection, node) => {
      const [name, key] = getRectangleCompKeyOrUndef(node);
      if (key) {
        // &args=kind:secondary;size:xxs
        const url = `${baseUrl}/iframe.html?id=${key}&viewMode=story`;
        selection.push({
          name: name as string,
          url: url,
        });
      }
      return selection;
    }, [] as SbCompSelection[]);
  return selectedSbComp;
}

function getRectangleCompKeyOrUndef(node: SceneNode) {
  if (isRectangle(node)) {
    const match = /(.*?)\[sb:c:([^\]]+)\]/g.exec(node.name);
    return [match?.[1]?.trim(), match?.[2]?.trim()];
  }
  return [undefined, undefined];
}

function createRectangles(stories: StoryEntries) {
  const nodes: RectangleNode[] = [];

  for (let i = 0; i < stories.length; i++) {
    const [key, story] = stories[i];
    const rect = getOrCreateCompRectangle(figma.currentPage, key, i);
    const name = `${story.title || story.kind} ${story.name || story.story}`;
    rect.name = `${name} [sb:c:${key}]`;
    nodes.push(rect);
  }

  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
}

function getOrCreateCompRectangle(page: PageNode, key: string, i: number) {
  for (const node of page.children) {
    const [_, thisNodeKey] = getRectangleCompKeyOrUndef(node);
    if (thisNodeKey === key) {
      return node as RectangleNode;
    }
  }
  const rect = figma.createRectangle();
  rect.y = 150;
  rect.x = i * 150;
  rect.fills = [{ type: "SOLID", color: { r: 0, g: 0.4, b: 0.8 } }];
  figma.currentPage.appendChild(rect);
  return rect;
}

function getOrCreatePage() {
  for (const p of figma.root.children) {
    if (p.name.includes('[sb]')) {
      return p;
    }
  }
  const page = figma.createPage();
  page.name = 'Design System [sb]';
  return page;
}

async function updateOrCreateSbUrlNode(page: PageNode, url: string) {
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

function getSbUrlNode(page: PageNode) {
  for (const node of page.children) {
    if (isText(node) && node.name.includes('[sb:url]')) {
      return node;
    }
  }
  throw new Error('Text element giving Storybook URL not found');
}

function isText(node: SceneNode): node is TextNode {
  return node.type === 'TEXT';
}

function isRectangle(node: SceneNode): node is RectangleNode {
  return node.type === 'RECTANGLE';
}