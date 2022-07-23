import { getLayoutStoryId } from '../1-import-stories/3-import-sb-detail';
import { listVariantProps, setStoryFrameProperties } from '../1-import-stories/import-sb-utils';
import { appConfig } from '../../../../common/app-config.js';
import type { Args, ArgTypes, CNode } from '../../../../common/sb-serialize.model.js';
import { propArrayToMap } from '../../../../common/storybook-utils.js';
import { isComponent, isComponentSet } from '../../../common/node-type-utils.js';
import { renderParentNode } from './3-render-parent-node';
import { getPageAndNode } from './get-page-and-node';
import {
  adjustGridToChildren,
  alignItemsInGrid,
  argsToVariantName,
  filterArgs,
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
  skipHistoryCommit?: boolean,
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

    let componentSet: ComponentSetNode | undefined = undefined;
    if (isComponentSet(storyNode)) {
      componentSet = storyNode;
    }
    if (!componentSet) {
      const prevSibling = siblings[childPosition - 1];
      if (isComponentSet(prevSibling) && getLayoutStoryId(prevSibling) === storyId) {
        componentSet = prevSibling;
      }
    }

    let name: string | undefined = undefined;

    let comp: ComponentNode | undefined = undefined;
    let width = 0,
      height = 0,
      x = gap,
      y = gap;
    if (!isComponentSet(componentSet)) {
      // TODO or if it's not the variants container for this component
      //
      name = argsToVariantName(args);
      comp = withDefaultProps(figma.createComponent());
      componentSet = figma.combineAsVariants([comp], parent, childPosition);
    } else {
      componentSet.layoutMode = 'NONE';
      alignItemsInGrid(componentSet, gap);
      // props / storyArgFilters would be undefined if componentSet is not a ComponentSetNode (impossible here). So we cast with `!`.
      const props = listVariantProps(componentSet, argTypes)!;
      const storyArgFilters = propArrayToMap(props);
      name = argsToVariantName(filterArgs(args, storyArgFilters));
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
    // If the flag is passed, we should make an explicit call to commitUndo from the front. Useful when importing the whole storybook, to avoid polluting the history.
    if (!skipHistoryCommit) {
      figma.commitUndo();
    }
  }
}
