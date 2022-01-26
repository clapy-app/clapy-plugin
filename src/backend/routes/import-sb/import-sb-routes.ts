import { NextFn, SbCompSelection } from '../../../common/app-models';
import { SbSelection, StoriesObj, storiesSamples } from './import-model';
import { createRectangles, getLayoutCompKeyOrUndef, getOrCreatePage, getSbUrlNode, StoryEntries, updateOrCreateSbUrlNode } from './import-sb-detail';

export function getStoriesSamples() {
  const samples = Object.entries(storiesSamples).map(([key, entry]) => [key as SbSelection, entry.label] as const);
  return samples;
}

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

  const selectedSbComp = figma.currentPage.selection
    .reduce((selection, node) => {
      const [name, id] = getLayoutCompKeyOrUndef(node);
      if (id) {
        // &args=kind:secondary;size:xxs
        const url = `${baseUrl}/iframe.html?id=${id}&viewMode=story`;
        selection.push({
          id,
          name: name as string,
          url: url,
          figmaId: node.id,
        });
      }
      return selection;
    }, [] as SbCompSelection[]);
  return selectedSbComp;
}
