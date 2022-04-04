import { appConfig } from '../../../common/app-config';
import { ArgTypeObj, NewVariant } from '../../../common/app-models';
import { Args, ArgTypes } from '../../../common/sb-serialize.model';
import { argTypesToValues as argTypeToValues, getArgDefaultValue } from '../../../common/storybook-utils';
import { isComponentSet } from '../../common/node-type-utils';
import { getSbCompSelection } from '../1-import-stories/1-select-node';
import { getPageAndNode } from '../2-update-canvas/get-page-and-node';
import {
  adjustGridToChildren,
  argsToVariantName,
  filterArgs,
  getWidthHeight,
  indexToCoord,
} from '../2-update-canvas/grid-utils';
import { removeNode, resizeNode } from '../2-update-canvas/update-canvas-utils';

export async function updateVariantsFromFilters(
  storyFigmaId: string,
  storyId: string,
  pageId: string,
  argTypes: ArgTypes,
  storyArgFilters: ArgTypeObj,
  initialArgs: Args,
  argsMatrix: Args[][],
) {
  try {
    const { node: componentSet } = getPageAndNode(pageId, storyFigmaId, storyId);
    if (!componentSet) {
      console.warn('No node found for this storyFigmaId.');
      return;
    }
    if (!isComponentSet(componentSet)) {
      console.warn('Not a ComponentSetNode.');
      return;
    }

    // Render each variant
    const variantNameToCoordMap = new Map<string, Coord>();
    for (let i = 0; i < argsMatrix.length; i++) {
      const row = argsMatrix[i];
      for (let j = 0; j < row.length; j++) {
        const args = row[j];
        const variantName = argsToVariantName(args);
        variantNameToCoordMap.set(variantName, { i, j, args });
      }
    }

    const gap = appConfig.variantsGridGap;
    let { width, height } = getWidthHeight(componentSet);

    const variantsToRemove: SceneNode[] = [];

    for (const child of componentSet.children) {
      const previousArgs = variantNameToArgs(child.name);
      addDefaultsToArgs(previousArgs, argTypes, initialArgs);
      const childName = argsToVariantName(previousArgs);

      const coord = variantNameToCoordMap.get(childName);
      if (!coord) {
        // Existing variant to remove
        variantsToRemove.push(child);
      } else {
        // Existing variant to keep and move
        const { i, j, args } = coord;
        moveAndRenameVariant(child, i, j, width, height, gap, args, storyArgFilters);

        variantNameToCoordMap.delete(childName);
      }
    }

    // Remaining entries in variantNameToCoordMap are the new variants we need to add and render later.
    const newVariants: NewVariant[] = [];
    for (const [, { i, j, args }] of variantNameToCoordMap.entries()) {
      const child = figma.createComponent();
      componentSet.appendChild(child);
      newVariants.push({
        i,
        j,
        args,
      });

      moveAndRenameVariant(child, i, j, width, height, gap, args, storyArgFilters);
      resizeNode(child, width, height);

      child.fills = [
        {
          blendMode: 'NORMAL',
          type: 'GRADIENT_RADIAL',
          visible: true,
          opacity: 1,
          gradientStops: [
            { color: { r: 0.7568627595901489, g: 0.8470588326454163, b: 0.9882352948188782, a: 1 }, position: 0 },
            { color: { r: 0.34117648005485535, g: 0.6078431606292725, b: 0.9882352948188782, a: 1 }, position: 1 },
          ],
          gradientTransform: [
            [6.123234262925839e-17, 1, 0],
            [-1, 6.123234262925839e-17, 1],
          ],
        },
      ];
    }

    for (const variant of variantsToRemove) {
      removeNode(variant);
    }

    const maxI = argsMatrix.length - 1;
    const maxJ = argsMatrix[0]?.length - 1;

    if (!(maxI >= 0 && maxJ >= 0)) {
      if (!componentSet.removed) {
        console.warn('All variants should have been removed, but the componentSet is not marked as removed. Bug?');
      }
      return;
    }

    adjustGridToChildren(componentSet, maxI, maxJ, width, height, gap);

    // Re-emit a refreshed selection to the front. Useful to update the `props` in the selection
    getSbCompSelection();

    return newVariants;
  } finally {
    figma.commitUndo();
  }
}

interface Coord {
  i: number;
  j: number;
  args: Args;
}

function variantNameToArgs(name: string) {
  const args: Args = {};
  for (const prop of name.split(',')) {
    const [argName, value] = prop.split('=').map(kv => kv.trim());
    args[argName] = value;
  }
  return args;
}

function addDefaultsToArgs(args: Args, argTypes: ArgTypes, initialArgs: Args) {
  for (const [argName, argType] of Object.entries(argTypes)) {
    const values = argTypeToValues(argType);
    // values undefined => unsupported argType (not a boolean or a list)
    if (!values) continue;
    const defaultValue = getArgDefaultValue(argName, initialArgs, values);
    if (!args[argName]) {
      args[argName] = defaultValue;
    }
  }
}

function moveAndRenameVariant(
  child: SceneNode,
  i: number,
  j: number,
  width: number,
  height: number,
  gap: number,
  args: Args,
  storyArgFilters: ArgTypeObj,
) {
  child.x = indexToCoord(i, width, gap);
  child.y = indexToCoord(j, height, gap);
  child.name = argsToVariantName(filterArgs(args, storyArgFilters));
}
