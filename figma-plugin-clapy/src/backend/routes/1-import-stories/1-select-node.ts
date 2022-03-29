import { NextFn, SbAnySelection, SbCompSelection, SbOtherSelection } from '../../../common/app-models';
import { ArgTypes } from '../../../common/sb-serialize.model';
import { getParentCompNode, listVariantProps } from './import-sb-utils';

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
  const selectedSbComp = figma.currentPage.selection.reduce((selections, selectedNode) => {
    const { node, sbUrl, storyId } = getParentCompNode(selectedNode);
    if (storyId && sbUrl && node) {
      // &args=kind:secondary;size:xxs
      const storyUrl = `${sbUrl}/iframe.html?id=${storyId}&viewMode=story`;
      const argTypes: ArgTypes = JSON.parse(node.getPluginData('storyArgTypes') || '{}');
      const initialArgs: ArgTypes = JSON.parse(node.getPluginData('storyInitialArgs') || '{}');
      const selection: SbCompSelection = {
        storyId,
        storyLabel: node.name,
        sbUrl,
        storyUrl,
        argTypes,
        initialArgs,
        figmaId: node.id,
        tagFigmaId: selectedNode.id,
        pageId: figma.currentPage.id,
        props: listVariantProps(node, argTypes),
      };
      selections.push(selection);
    } else {
      const selection: SbOtherSelection = {
        figmaId: selectedNode.id,
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
  const date = new Date().toISOString().substring(0, 19).replace('T', ' ');
  console.log(date, node.name, '=>', node);
}
