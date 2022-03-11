import { ArgTypeObj } from '../../../common/app-models';
import { Args } from '../../../common/sb-serialize.model';
import { isComponentSet, WithChildrenNode } from '../../common/canvas-utils';
import { resizeNode } from './update-canvas-utils';

// The front gives the index (i = 0, 1, 2...) of the component to insert.
// For each new argType, new blocks of components are added, by adding extra rows or extra columns depending on the axis on which the argType is added.
// Tableau 2D [x:number][y:number] = args object (todo réfléchir à comment le construire)
// width/height fournis par la fonction resizeGrid, à préparer.
// Boucle sur les éléments du tableau dans l'ordre, rendre en back et rendre ici avec coord et nodes en arg.

export async function runGrid() {
  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length !== 1 || !isComponentSet(selectedNodes[0])) {
    console.warn('Not a valid selection for runGrid().');
    return;
  }
  const node = selectedNodes[0];

  alignItemsInGrid(node);

  // const { width, height } = getWidthHeight(node);
  // resizeGrid(node, 20, width, height, width + 10, height + 10);
  // console.log('resized');
}

// This implementation trusts the given sizes instead of calculating them from the parent node and a new child node to add.
export function resizeGrid(
  node: WithChildrenNode,
  gap: number,
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
) {
  let maxI = 0,
    maxJ = 0;
  for (const child of node.children) {
    const i = coordToIndex(child.x, oldWidth, gap);
    const x = indexToCoord(i, newWidth, gap);
    const j = coordToIndex(child.y, oldHeight, gap);
    const y = indexToCoord(j, newHeight, gap);
    child.x = x;
    child.y = y;
    if (i > maxI) {
      maxI = i;
    }
    if (j > maxJ) {
      maxJ = j;
    }
  }
  return { maxI, maxJ };
}

export function getMaxIJ(node: WithChildrenNode, gap: number, width: number, height: number) {
  let maxI = 0,
    maxJ = 0;
  for (const child of node.children) {
    const i = coordToIndex(child.x, width, gap);
    const j = coordToIndex(child.y, height, gap);
    if (i > maxI) {
      maxI = i;
    }
    if (j > maxJ) {
      maxJ = j;
    }
  }
  return { maxI, maxJ };
}

export function getWidthHeight(node: ComponentSetNode) {
  // First, get highest width and height among children
  let width = 0,
    height = 0;
  for (const child of node.children) {
    if (child.width > width) {
      width = child.width;
    }
    if (child.height > height) {
      height = child.height;
    }
  }
  return { width, height };
}

// alignItemsInGrid : bouger de manière brutale les doublons à la fin de la ligne. En passant sur les cellules, commencer par accumuler les doublons dans une liste séparée. Une fois tous les autres éléments bien alignés, parcourir les doublons et les pousser à la fin de leurs lignes respectives (ou aux premières cases disponibles de la ligne ?)
export function alignItemsInGrid(node: ComponentSetNode, gap: number = 20) {
  node.children;
  let { width, height } = getWidthHeight(node);
  // With the gap, width and height, we have a grid.
  // gap is used for the container padding, and horizontal and vertical spacing between variants.
  // Then loop on children, find the closest location in the grid.
  // We check the top-left corner of the node.
  for (const child of node.children) {
    child.x = roundGrid(child.x, width, gap);
    child.y = roundGrid(child.y, height, gap);
  }

  // Then reorder nodes
  const children = [...node.children];
  children.sort((a, b) => {
    return a.y < b.y ? -1 : a.y > b.y ? 1 : a.x - b.x;
  });
  for (const child of children) {
    node.appendChild(child);
  }
}

function getGridSize(node: ComponentSetNode) {
  const child = node.children[0];
  let { width, height } = getWidthHeight(node);
  const nextNodeX = nextHorizontalNode(child);
  const nextNodeY = nextVerticalNode(child);
  const gap = Math.min(
    nextNodeX ? Math.abs(nextNodeX.x - child.x) - width : child.x,
    nextNodeY ? Math.abs(nextNodeY.y - child.y) - height : child.y,
  );
  return { width, height, gap };
}

function nextHorizontalNode(node: SceneNode) {
  const parent = node.parent!;
  const siblings = parent.children;
  const index = siblings.indexOf(node);
  if (index === -1) throw new Error('Index -1 of node among siblings, wtf?');

  for (let i = index; i < siblings.length; i++) {
    const n = siblings[i];
    if (n.x > node.x) {
      return n;
    }
  }
}

function nextVerticalNode(node: SceneNode) {
  const parent = node.parent!;
  const siblings = parent.children;
  const index = siblings.indexOf(node);
  if (index === -1) throw new Error('Index -1 of node among siblings, wtf?');

  for (let i = index; i < siblings.length; i++) {
    const n = siblings[i];
    if (n.y > node.y) {
      return n;
    }
  }
}

export function adjustGridToChildren(
  componentSet: ComponentSetNode,
  maxI: number,
  maxJ: number,
  width: number,
  height: number,
  gap: number,
) {
  const gridWidth = indexToCoord(maxI, width, gap) + width + gap;
  const gridHeight = indexToCoord(maxJ, height, gap) + height + gap;
  resizeNode(componentSet, gridWidth, gridHeight);
}

/**
 * @param position x or y
 * @param size width or height in pixels
 * @param gap distance between elements in pixels
 * @returns new x or y matching the closest location in the grid.
 */
function roundGrid(position: number, size: number, gap: number) {
  // Updates the position to the closest location in the grid.
  return indexToCoord(coordToIndex(position, size, gap), size, gap);
}

/**
 * @param index i or j, position in the matrix
 * @param size width or height in pixels
 * @param gap distance between elements in pixels
 * @returns x or y
 */
export function indexToCoord(index: number, size: number, gap: number) {
  const distanceBetweenTwoChildren = size + gap;
  return index * distanceBetweenTwoChildren + gap;
}

/**
 * @param position x or y
 * @param size width or height in pixels
 * @param gap distance between elements in pixels
 * @returns i or j, position in the matrix
 */
function coordToIndex(position: number, size: number, gap: number) {
  const distanceBetweenTwoChildren = size + gap;
  return Math.round((position - gap) / distanceBetweenTwoChildren);
}

export function argsToVariantName(args: Args) {
  return Object.entries(args)
    .sort()
    .map(([argName, value]) => `${argName}=${value}`)
    .join(', ');
}

export function filterArgs(args: Args, storyArgFilters: ArgTypeObj) {
  const argsFiltered: Args = {};
  for (const [argName, arg] of Object.entries(args)) {
    if (storyArgFilters[argName]) {
      argsFiltered[argName] = arg;
    }
  }
  return argsFiltered;
}
