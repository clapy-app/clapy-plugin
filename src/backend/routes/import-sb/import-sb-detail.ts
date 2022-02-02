import { isLayout } from './canvas-utils';
import { StoryObj } from './import-model';

export type StoryEntry = [string, StoryObj];
export type StoryEntries = StoryEntry[];

export function getLayoutStoryId(node: SceneNode) {
  if (isLayout(node)) {
    return node.getPluginData('storyId');
  }
  return undefined;
}

export interface FrameCreated {
  figmaId: string;
  url: string;
  storyId: string;
}

export function createFrames(stories: StoryEntries, sbUrl: string) {
  const nodes: FrameNode[] = [];
  const response: FrameCreated[] = [];

  for (let i = 0; i < stories.length; i++) {
    const [storyId, story] = stories[i];
    const frame = getOrCreateCompFrame(figma.currentPage, storyId, i);
    frame.name = `${story.title || story.kind} ${story.name || story.story}`;
    frame.setPluginData('sbUrl', sbUrl);
    frame.setPluginData('storyId', storyId);
    frame.setRelaunchData({ preview: '' });
    nodes.push(frame);
    const url = `${sbUrl}/iframe.html?id=${storyId}&viewMode=story`;
    response.push({
      figmaId: frame.id,
      url,
      storyId,
    });
  }

  figma.viewport.scrollAndZoomIntoView(nodes);
  return response;
}

function getOrCreateCompFrame(page: PageNode, storyId: string, i: number) {
  let frame = getCompFrame(page, storyId);
  if (!frame) {
    frame = figma.createFrame();
    frame.y = 100;
    frame.x = i * 550;
    frame.resize(500, 300);
    frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    figma.currentPage.appendChild(frame);
  }
  return frame;
}

export function getCompFrame(page: PageNode, storyId: string) {
  for (const node of page.children) {
    if (/* node.getPluginData('sbUrl') === sbUrl && */ getLayoutStoryId(node) === storyId) {
      return node as FrameNode;
    }
  }
  return null;
}

export function getOrCreatePage() {
  for (const p of figma.root.children) {
    if (p.getPluginData('sbUrl')) {
      return p;
    }
  }
  const page = figma.createPage();
  return page;
}
