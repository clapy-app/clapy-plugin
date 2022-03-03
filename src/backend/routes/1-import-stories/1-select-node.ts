import { NextFn, SbAnySelection, SbCompSelection, SbOtherSelection } from '../../../common/app-models';
import { ArgTypes } from '../../../common/sb-serialize.model';
import { isPage } from '../../common/canvas-utils';
import { getLayoutStoryId } from './3-import-sb-detail';

export async function getSbCompSelection() {
  sendSbCompSelection?.();
}

// Subscription

let sendSbCompSelection: (() => void) | undefined;

export function selectedSbComp(next: NextFn<SbAnySelection[]>) {
  sendSbCompSelection = () => next(prepareSbCompSelection());
  figma.on('selectionchange', sendSbCompSelection);
  // Initial emit, for dev, when the figma plugin is open after the webapp.
  sendSbCompSelection();
}

function prepareSbCompSelection() /* : SbCompSelection[] */ {
  const pageSbUrl: string | undefined = figma.currentPage.getPluginData('sbUrl');

  const selectedSbComp = figma.currentPage.selection.reduce((selections, node0) => {
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
      const argTypes: ArgTypes = JSON.parse(node.getPluginData('storyArgTypes') || '{}');
      const selection: SbCompSelection = {
        storyId,
        storyLabel: node.name,
        sbUrl,
        storyUrl,
        argTypes,
        figmaId: node.id,
        tagFigmaId: node0.id,
        pageId: figma.currentPage.id,
      };
      selections.push(selection);
    } else {
      const selection: SbOtherSelection = {
        figmaId: node0.id,
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
  console.log(node.name, '=>', node);
}

// During the selection, if it is a componentSet with variants, we read the list of current props rendered (with axis and order) + the complete list to have those excluded.
// The front will merge and render the list.
