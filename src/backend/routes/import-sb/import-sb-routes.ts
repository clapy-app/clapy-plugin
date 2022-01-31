import { NextFn, SbCompSelection } from '../../../common/app-models';
import { SbSelection, StoriesObj, storiesSamples } from './import-model';
import { createRectangles, getLayoutCompKeyOrUndef, getOrCreatePage, getSbUrlNode, RectangleCreated, StoryEntries, updateOrCreateSbUrlNode } from './import-sb-detail';

export function getStoriesSamples() {
  const samples = Object.entries(storiesSamples).map(([key, entry]) => [key as SbSelection, entry.label] as const);
  return samples;
}

export async function importStories(sbSelection: SbSelection): Promise<RectangleCreated[]> {
  const { stories: storiesWrapper, baseUrl } = storiesSamples[sbSelection];
  const stories: StoryEntries = Object.entries(storiesWrapper.stories as StoriesObj)
    // Alternative: filter on !story.parameters.docsOnly
    .filter(([_, story]) => story.parameters.__isArgsStory)
    .slice(0, 7)
    ;

  const page = getOrCreatePage();
  figma.currentPage = page;

  await updateOrCreateSbUrlNode(page, baseUrl);

  return createRectangles(stories, baseUrl);
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
  const baseUrl = sbUrlNode?.characters;

  const selectedSbComp = figma.currentPage.selection
    .reduce((selection, node) => {
      const [name, id] = getLayoutCompKeyOrUndef(node);
      if (id && baseUrl) {
        // &args=kind:secondary;size:xxs
        const url = `${baseUrl}/iframe.html?id=${id}&viewMode=story`;
        selection.push({
          id,
          name: name as string,
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
