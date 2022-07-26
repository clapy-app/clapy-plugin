import { resizeNode } from '../2-update-canvas/update-canvas-utils';
import type { SbCompSelection } from '../../../../common/app-models';
import { sbUrlIframe } from '../../../../common/storybook-utils';
import type { MyCompNode } from '../../../common/node-type-utils';
import { isFrame, isLayout, isMyComp } from '../../../common/node-type-utils';
import type { SbStoryWithFolder } from './import-model';
import { listVariantProps, setStoryFrameProperties } from './import-sb-utils';

type StoryEntry = [string, SbStoryWithFolder];
export type StoryEntries = StoryEntry[];

export function getLayoutPluginData(node: SceneNode, key: string) {
  if (isLayout(node)) {
    return node.getPluginData(key);
  }
  return undefined;
}

export function getLayoutStoryId(node: SceneNode) {
  return getLayoutPluginData(node, 'storyId');
}

export type FrameCreated = SbCompSelection;

export function createFrames(storyEntries: StoryEntries, sbUrl: string, page: PageNode) {
  const nodes: MyCompNode[] = [];
  const response: FrameCreated[] = [];

  const container = getOrCreateContainer(page, page, 'Design System', 'root', 1);

  let hasSingleTopFolder = true;
  let previousTopFolder: string | undefined = undefined;
  let hasAtLeastOneSingleFolder = false;
  for (let i = 0; i < storyEntries.length; i++) {
    const [storyId, story] = storyEntries[i];
    const storyTitle = story.title || story.kind;
    const fragments = storyTitle.split('/');
    story.folders = fragments;
    if (i === 0) {
      previousTopFolder = fragments[0];
    } else if (hasSingleTopFolder && previousTopFolder !== fragments[0]) {
      hasSingleTopFolder = false;
    }
    if (!(fragments.length > 1)) {
      hasAtLeastOneSingleFolder = true;
    }
    if (!hasSingleTopFolder && hasAtLeastOneSingleFolder) {
      break;
    }
  }
  const indexShift = hasSingleTopFolder && !hasAtLeastOneSingleFolder ? 1 : 0;

  for (let i = 0; i < storyEntries.length; i++) {
    const [storyId, story] = storyEntries[i];
    const storyTitle = story.title || story.kind;

    const fragments = story.folders || storyTitle.split('/');
    let folder: FrameNode | undefined = undefined;
    // Loop over all fragments (folders).
    for (let i = indexShift; i < fragments.length; i++) {
      const fragment = fragments[i];
      folder = getOrCreateContainer(page, folder || container, fragment, fragment, i + 2 - indexShift);
    }
    if (!folder) {
      console.warn('No folder found for the story, which is unexpected. Defaulting to the top-level container.');
      folder = container;
    }

    const frame = getOrCreateCompFrame(folder, page, storyId, i);

    const argTypes = story.parameters.argTypes || {};
    const initialArgs = story.initialArgs || {};
    setStoryFrameProperties(frame, story.name || story.story, sbUrl, storyId, storyTitle, argTypes, initialArgs);

    nodes.push(frame);
    // &args=kind:secondary;size:xxs
    const url = `${sbUrlIframe(sbUrl)}?id=${storyId}&viewMode=story`;
    response.push({
      figmaId: frame.id,
      tagFigmaId: frame.id,
      pageId: page.id,
      storyId,
      storyLabel: frame.name,
      sbUrl,
      storyUrl: url,
      argTypes,
      initialArgs,
      props: listVariantProps(frame, argTypes),
    });
  }

  figma.viewport.scrollAndZoomIntoView(nodes);
  return response;
}

function getOrCreateContainer(
  page: PageNode,
  parent: FrameNode | PageNode,
  name: string,
  containerId: string,
  depth: number,
) {
  let frame = parent.children.find(node => getLayoutPluginData(node, 'containerId') === containerId);
  if (frame && !isFrame(frame)) {
    throw new Error(`Node found for containerId root is not a frame.`);
  }
  if (!frame) {
    frame = figma.createFrame();
    if (parent === page) {
      // depth === 1
      frame.y = 100;
      frame.x = 0;
    }
    parent.appendChild(frame);
  }
  frame.name = name;
  frame.layoutMode = depth % 2 === 0 ? 'VERTICAL' : 'HORIZONTAL';
  frame.layoutGrow = 0;
  frame.counterAxisSizingMode = 'AUTO';
  frame.layoutAlign = 'INHERIT';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.paddingBottom = 100 / depth;
  frame.paddingLeft = 100 / depth;
  frame.paddingTop = 100 / depth;
  frame.paddingRight = 100 / depth;
  frame.itemSpacing = 100 / depth;
  frame.strokeAlign = 'INSIDE';
  frame.strokeWeight = 5 / depth;
  frame.dashPattern = [10, 10];
  frame.strokes = [
    {
      type: 'SOLID',
      color: { r: 0, g: 0, b: 0 },
      opacity: 1,
    },
  ];
  frame.fills =
    depth === 1
      ? []
      : [
          {
            type: 'SOLID',
            color: hexToRgb(['FBFBFB', 'F7F7F7', 'F3F3F3', 'EEEEEE', 'EAEAEA'][depth - 2]),
            opacity: 1,
          },
        ];

  frame.setPluginData('containerId', containerId);
  frame.expanded = true;
  return frame;
}

function hexToRgb(hex: string) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    console.warn('Invalid color hexadecimal value:', hex, '- defaulting to white');
    return { r: 1, g: 1, b: 1 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

function getOrCreateCompFrame(container: FrameNode, page: PageNode, storyId: string, i: number) {
  // Could optimize by grouping all researches: pass the list of story Ids, e.g. as set, then call findAll() instead of findOne().
  let frame = getCompNode(container, page, storyId);
  if (!frame) {
    frame = figma.createFrame();
    frame.y = 100;
    frame.x = i * 550;
    resizeNode(frame, 500, 300);
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    container.appendChild(frame);
  }
  return frame;
}

// TODO move to import-sb-utils because it's used in another module
export function getCompNode(container: FrameNode | PageNode, page: PageNode, storyId: string) {
  let frame = container.findChild(node => getLayoutStoryId(node) === storyId);
  if (!frame) {
    frame = page.findOne(node => getLayoutStoryId(node) === storyId);
    if (frame) {
      console.warn('Story', storyId, 'found, but outside the container. It is moved to the container.');
      container.appendChild(frame);
    }
  }
  if (frame && !isMyComp(frame)) {
    throw new Error(`Node found for storyId ${storyId} is not a frame.`);
  }
  return frame;
}

export function getOrCreatePage(sbUrl: string) {
  for (const p of figma.root.children) {
    if (p.getPluginData('sbUrl') === sbUrl) {
      return p;
    }
  }
  const page = figma.createPage();
  return page;
}
