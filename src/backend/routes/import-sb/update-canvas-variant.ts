import { isComponent, isComponentSet } from './canvas-utils';
import { Args, ArgTypes, CNode } from './sb-serialize.model';
import { renderParentNode } from './update-canvas/1-render-parent-node';
import { getPageAndNode } from './update-canvas/get-page-and-node';
import { alignItemsInGrid, getMaxIJ, getWidthHeight, indexToCoord, resizeGrid } from './update-canvas/grid-utils';
import { resizeNode, withDefaultProps } from './update-canvas/update-canvas-utils';

export async function updateCanvasVariant(
  sbNodes: CNode[],
  storyFigmaId: string,
  storyId: string,
  pageId: string,
  argTypes: ArgTypes,
  args: Args,
  i: number,
  j: number,
) {
  try {
    const gap = 20;
    const { page, node: storyNode } = getPageAndNode(pageId, storyFigmaId, storyId);
    if (!page || !storyNode || !storyNode.parent) {
      return;
    }
    const parent = storyNode.parent;
    const siblings = parent.children;
    const childPosition = siblings.indexOf(storyNode);
    // Check previous child, if it is a frame
    let componentSet = siblings[childPosition - 1];
    let comp: ComponentNode | undefined = undefined;
    const name = Object.entries(args)
      .sort()
      .map(([argName, value]) => `${argName}=${value}`)
      .join(', ');
    let width = 0,
      height = 0,
      x = gap,
      y = gap;
    if (!componentSet || !isComponentSet(componentSet)) {
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
        foundByCoordinates.remove();
      }
      const found = foundByName || foundByCoordinates;

      if (isComponent(found)) {
        comp = found;
      } else {
        if (found) {
          console.warn('Child found is not a component in component set, bug? Removing it.');
          found.remove();
        }
        // Not found, let's create it.
        comp = withDefaultProps(figma.createComponent());
        componentSet.appendChild(comp);
      }
    }

    componentSet.name = storyNode.name;
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
    const gridWidth = indexToCoord(maxI, width, gap) + width + gap;
    const gridHeight = indexToCoord(maxJ, height, gap) + height + gap;
    resizeNode(componentSet, gridWidth, gridHeight);
  } finally {
    figma.commitUndo();
  }
}
