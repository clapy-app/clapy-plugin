import { NextFn, SbCompSelection } from '../../../common/app-models';
import { SbStoriesWrapper, storiesSamples } from './import-model';
import { createFrames, FrameCreated, getLayoutStoryId, getOrCreatePage, StoryEntries } from './import-sb-detail';

export function getStoriesSamples() {
  return storiesSamples;
}

export async function importStories(sbUrl: string, storiesWrapper: SbStoriesWrapper): Promise<FrameCreated[]> {
  try {
    const stories: StoryEntries = Object.entries(storiesWrapper.stories)
      // Alternative: filter on !story.parameters.docsOnly
      .filter(([_, story]) => story.parameters.__isArgsStory)
      .slice(0, 7)
      ;

    const page = getOrCreatePage(sbUrl);
    page.setPluginData('sbUrl', sbUrl);
    page.setPluginData('baseUrl', '');
    page.name = `Design System (${sbUrl})`;
    page.setRelaunchData({ open: '' });
    figma.currentPage = page;

    // Create placeholders for components that will be imported.
    return createFrames(stories, sbUrl);
  } finally {
    figma.commitUndo();
  }
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
  const pageSbUrl: string | undefined = figma.currentPage.getPluginData('sbUrl');

  const selectedSbComp = figma.currentPage.selection
    .reduce((selection, node) => {
      const storyId = getLayoutStoryId(node);
      const sbUrl = node.getPluginData('sbUrl') || pageSbUrl;
      if (storyId && sbUrl) {
        // &args=kind:secondary;size:xxs
        const url = `${sbUrl}/iframe.html?id=${storyId}&viewMode=story`;
        selection.push({
          id: storyId,
          name: node.name,
          url: url,
          figmaId: node.id,
        });
      } else {
        selection.push({
          figmaId: node.id,
        });
      }
      return selection;
    }, [] as SbCompSelection[]);
  // To log the selection flex config:
  if (selectedSbComp.length === 1) {
    show(figma.getNodeById(selectedSbComp[0].figmaId) as FrameNode);
  }
  return selectedSbComp;
}

function show(node: FrameNode) {
  console.log('--------------');
  console.log(node.name, ' =>', node);

  // console.log(node.name, ' => layoutMode:', node.layoutMode);
  // console.log('layoutGrow:', node.layoutGrow);
  // console.log('counterAxisSizingMode:', node.counterAxisSizingMode);
  // console.log('layoutAlign:', node.layoutAlign);
  // console.log('primaryAxisSizingMode:', node.primaryAxisSizingMode);
}
