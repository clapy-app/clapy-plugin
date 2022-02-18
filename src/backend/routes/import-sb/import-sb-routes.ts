import { NextFn, SbAnySelection, SbCompSelection, SbOtherSelection } from '../../../common/app-models';
import { isPage } from './canvas-utils';
import { storiesSamples } from './import-model';
import { createFrames, FrameCreated, getLayoutStoryId, getOrCreatePage, StoryEntries } from './import-sb-detail';
import { SbStoriesWrapper } from './sb-serialize.model';

export function getStoriesSamples() {
  return storiesSamples as Required<typeof storiesSamples>;
}

export async function importStories(sbUrl: string, storiesWrapper: SbStoriesWrapper): Promise<FrameCreated[]> {
  try {
    const stories: StoryEntries = Object.entries(storiesWrapper.stories)
      // Alternative: filter on !story.parameters.docsOnly
      .filter(([_, story]) => story.parameters.__isArgsStory)
      // .filter(([storyId, _]) => storyId === 'components-tooltip--multi')
      // .slice(0, 1)
      ;

    const page = getOrCreatePage(sbUrl);
    page.setPluginData('sbUrl', sbUrl);
    page.setPluginData('baseUrl', '');
    page.name = `Design System (${sbUrl})`;
    page.setRelaunchData({ open: '' });
    figma.currentPage = page;

    // Create placeholders for components that will be imported.
    return createFrames(stories, sbUrl, page);
  } finally {
    figma.commitUndo();
  }
}

export function detachPage() {
  const page = figma.currentPage;
  page.setRelaunchData({});
  page.setPluginData('sbUrl', '');
  page.name = `${page.name} - detached`;
}

export async function getSbCompSelection() {
  sendSbCompSelection?.();
}

// Subscription

let sendSbCompSelection: (() => void) | undefined;

export function selectedSbComp(next: NextFn<SbAnySelection[]>) {
  sendSbCompSelection = () => next(prepareSbCompSelection());
  figma.on("selectionchange", sendSbCompSelection);
  // Initial emit, for dev, when the figma plugin is open after the webapp.
  sendSbCompSelection();
}

function prepareSbCompSelection()/* : SbCompSelection[] */ {
  const pageSbUrl: string | undefined = figma.currentPage.getPluginData('sbUrl');

  const selectedSbComp = figma.currentPage.selection
    .reduce((selections, node0) => {
      let storyId: string | undefined = undefined;
      const sbUrl = node0.getPluginData('sbUrl') || pageSbUrl;
      let node: SceneNode | null = node0;
      if (sbUrl) {
        while (node && !isPage(node) && !(storyId = getLayoutStoryId(node))) {
          node = node.parent as SceneNode;
        }
      }
      if (storyId && sbUrl && node) {
        // &args=kind:secondary;size:xxs
        const storyUrl = `${sbUrl}/iframe.html?id=${storyId}&viewMode=story`;
        const selection: SbCompSelection = {
          storyId,
          storyLabel: node.name,
          storyUrl,
          figmaId: node.id,
          tagFigmaId: node0.id,
          pageId: figma.currentPage.id,
        };
        selections.push(selection);
      } else {
        const selection: SbOtherSelection = {
          figmaId: node.id,
          pageId: figma.currentPage.id,
        };
        selections.push(selection);
      }
      return selections;
    }, [] as SbAnySelection[]);
  // To log the selection flex config:
  if (selectedSbComp.length === 1) {
    show(figma.getNodeById(selectedSbComp[0].tagFigmaId || selectedSbComp[0].figmaId) as FrameNode);
  }
  return selectedSbComp;
}

function show(node: FrameNode) {
  console.log('--------------');
  console.log(node.name, ' =>', node);
}
