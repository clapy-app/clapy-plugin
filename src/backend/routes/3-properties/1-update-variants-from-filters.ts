import { appConfig } from '../../../common/app-config';
import { ArgTypeObj } from '../../../common/app-models';
import { Args, ArgTypes, Dict } from '../../../common/sb-serialize.model';
import { argTypesToValues as argTypeToValues, getArgDefaultValue } from '../../../common/storybook-utils';
import { isComponentSet } from '../../common/canvas-utils';
import { getSbCompSelection } from '../1-import-stories/1-select-node';
import { getPageAndNode } from '../2-update-canvas/get-page-and-node';
import { adjustGridToChildren, argsToVariantName, getWidthHeight, indexToCoord } from '../2-update-canvas/grid-utils';
import { removeNode } from '../2-update-canvas/update-canvas-utils';

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
    const { page, node: storyNode } = getPageAndNode(pageId, storyFigmaId, storyId);
    if (!storyNode) {
      console.warn('No node found for this storyFigmaId.');
      return;
    }
    if (!isComponentSet(storyNode)) {
      console.warn('Not a ComponentSetNode.');
      return;
    }

    // TODO required? Or derived from the component set children when selected?
    // storyNode.setPluginData('storyArgFilters', JSON.stringify(storyArgFilters));

    // Render each variant
    const variantNameToCoordMap: Dict<Coord> = {};
    for (let i = 0; i < argsMatrix.length; i++) {
      const row = argsMatrix[i];
      for (let j = 0; j < row.length; j++) {
        const args = row[j];
        const name = argsToVariantName(args);
        variantNameToCoordMap[name] = { i, j };
      }
    }

    const gap = appConfig.variantsGridGap;
    let { width, height } = getWidthHeight(storyNode);

    let maxI: number = -1,
      maxJ: number = -1;
    for (const child of storyNode.children) {
      const args = variantNameToArgs(child.name);
      addDefaultsToArgs(args, argTypes, initialArgs);
      const childName = argsToVariantName(args);

      const coord = variantNameToCoordMap[childName];
      if (!coord) {
        removeNode(child);
      } else {
        const { i, j } = coord;
        const x = indexToCoord(i, width, gap);
        const y = indexToCoord(j, height, gap);
        child.x = x;
        child.y = y;
        child.name = argsToVariantName(filterArgs(args, storyArgFilters));

        if (i > maxI) maxI = i;
        if (j > maxJ) maxJ = j;
      }
    }

    if (maxI === -1 || maxJ === -1) {
      if (!storyNode.removed) {
        console.warn(
          'No child left in the variants componentSet, but the component set is not marked as removed. Bug?',
        );
      }
      return;
    }
    adjustGridToChildren(storyNode, maxI, maxJ, width, height, gap);

    // Re-emit a refreshed selection to the front. Useful to update the `props` in the selection
    getSbCompSelection();

    // TODO re-add missing variants

    // TODO From the argsMatrix, I know the expected locations of variants.
    // Now I should loop over existing variants.
    // - (optional: align children in the matrix?)
    // - calculate the mapping coordinate => i,j. The utility should already exist somewhere.
    // - Prepare the map name => i,j ?
    // - Or make the map from the matrix instead. Then:
    // For each variant, I check if it is in the matrix (indexed by name?) and move it to the new location.
    // - If an existing variant is not in the matrix, delete it.
    // => I can test here
    // - Find a way to identifiy missing variants. If useful, add placeholders and return them to the front.
    // - From the front, loop over the placeholders, render variants and replace them.
    //  => I may want to change the update to auto-detect missing variants without placeholders and still render them.
  } finally {
    figma.commitUndo();
  }
}

interface Coord {
  i: number;
  j: number;
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

function filterArgs(args: Args, storyArgFilters: ArgTypeObj) {
  const argsFiltered: Args = {};
  for (const [argName, arg] of Object.entries(args)) {
    if (storyArgFilters[argName]) {
      argsFiltered[argName] = arg;
    }
  }
  return argsFiltered;
}
