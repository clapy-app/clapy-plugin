import { appConfig } from '../../../common/app-config';
import { Args, ArgTypes, CNode } from '../../../common/sb-serialize.model';
import { isComponent, isComponentSet } from '../../common/canvas-utils';
import { setStoryFrameProperties } from '../1-import-stories/import-sb-utils';
import { renderParentNode } from './3-render-parent-node';
import { getPageAndNode } from './get-page-and-node';
import {
  adjustGridToChildren,
  alignItemsInGrid,
  argsToVariantName,
  getMaxIJ,
  getWidthHeight,
  indexToCoord,
  resizeGrid,
} from './grid-utils';
import { removeNode, withDefaultProps } from './update-canvas-utils';

export async function updateCanvasVariant(
  sbNodes: CNode[],
  storyFigmaId: string,
  sbUrl: string,
  storyId: string,
  pageId: string,
  argTypes: ArgTypes,
  initialArgs: Args,
  args: Args,
  i: number,
  j: number,
) {
  try {
    const gap = appConfig.variantsGridGap;
    const { page, node: storyNode } = getPageAndNode(pageId, storyFigmaId, storyId);
    if (!page || !storyNode || !storyNode.parent) {
      return;
    }
    const parent = storyNode.parent;
    const siblings = parent.children;
    const childPosition = siblings.indexOf(storyNode);

    let componentSet = isComponentSet(storyNode)
      ? storyNode
      : // Check previous child, if it is a frame
        siblings[childPosition - 1];

    let comp: ComponentNode | undefined = undefined;
    const name = argsToVariantName(args);
    let width = 0,
      height = 0,
      x = gap,
      y = gap;
    if (!isComponentSet(componentSet)) {
      // TODO or if it's not the variants container for this component
      //
      comp = withDefaultProps(figma.createComponent());
      componentSet = figma.combineAsVariants([comp], parent, childPosition);
    } else {
      componentSet.layoutMode = 'NONE';
      alignItemsInGrid(componentSet, gap);
      // Check if the component set already contains the same combination
      const foundByName = componentSet.children.find(c => c.name === name);

      // Also check if there is a component at the target coordinates.
      ({ width, height } = getWidthHeight(componentSet));
      x = indexToCoord(i, width, gap);
      y = indexToCoord(j, height, gap);
      const foundByCoordinates = componentSet.children.find(c => c.x === x && c.y === y);
      if (foundByName && foundByCoordinates && foundByName !== foundByCoordinates) {
        removeNode(foundByCoordinates);
      }
      const found = foundByName || foundByCoordinates;

      if (isComponent(found)) {
        comp = found;
      } else {
        if (found) {
          console.warn('Child found is not a component in component set, bug? Removing it.');
          removeNode(found);
        }
        // Not found, let's create it.
        comp = withDefaultProps(figma.createComponent());
        componentSet.appendChild(comp);
      }
    }

    // parent node properties
    setStoryFrameProperties(
      componentSet,
      storyNode.name,
      sbUrl,
      storyId,
      storyNode.getPluginData('storyTitle'),
      argTypes,
      initialArgs,
    );

    // Variant node properties
    comp.name = name;
    comp.x = x;
    comp.y = y;

    await renderParentNode(comp, sbNodes, storyId, true);

    let maxI = 0,
      maxJ = 0;

    if (comp.width > width || comp.height > height) {
      // if comp size > previous size, resize grid
      const newWidth = Math.max(width, comp.width);
      const newHeight = Math.max(height, comp.height);
      ({ maxI, maxJ } = resizeGrid(componentSet, gap, width, height, newWidth, newHeight));
      width = newWidth;
      height = newHeight;
    } else {
      ({ maxI, maxJ } = getMaxIJ(componentSet, gap, width, height));
    }

    // resize component set after resizing (or not) the grid
    adjustGridToChildren(componentSet, maxI, maxJ, width, height, gap);

    // TODO once ready
    if (storyNode !== componentSet) {
      removeNode(storyNode);
    }

    return componentSet.id;
  } finally {
    figma.commitUndo();
  }
}
