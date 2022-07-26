import type { MyCompNode } from '../../../common/node-type-utils.js';
import { isBaseFrameMixin } from '../../../common/node-type-utils.js';

export function horizontalFillContainer(node: MyCompNode) {
  const parentDirection = checkAndGetParentDirection(node);
  if (!parentDirection) {
    return;
  }
  if (parentDirection === 'horizontal') {
    primaryAxisFillContainer(node);
  } else {
    counterAxisFillContainer(node);
  }
}

export function horizontalHugContents(node: MyCompNode) {
  const nodeVertical = node.layoutMode === 'VERTICAL';
  // The default is horizontal, e.g. if the node is not auto-layout.
  const nodeHorizontal = !nodeVertical;
  if (nodeHorizontal) {
    primaryAxisHugContents(node);
  } else {
    counterAxisHugContents(node);
  }
}

export function horizontalFixedSize(node: MyCompNode) {
  const nodeVertical = node.layoutMode === 'VERTICAL';
  // The default is horizontal, e.g. if the node is not auto-layout.
  const nodeHorizontal = !nodeVertical;
  if (nodeHorizontal) {
    primaryAxisFixedSize(node);
  } else {
    counterAxisFixedSize(node);
  }
}

export function verticalFillContainer(node: MyCompNode) {
  const parentDirection = checkAndGetParentDirection(node);
  if (!parentDirection) {
    return;
  }
  if (parentDirection === 'vertical') {
    primaryAxisFillContainer(node);
  } else {
    counterAxisFillContainer(node);
  }
}

export function verticalHugContents(node: MyCompNode) {
  const nodeVertical = node.layoutMode === 'VERTICAL';
  // The default is horizontal, e.g. if the node is not auto-layout.
  if (nodeVertical) {
    primaryAxisHugContents(node);
  } else {
    counterAxisHugContents(node);
  }
}

export function verticalFixedSize(node: MyCompNode) {
  const nodeVertical = node.layoutMode === 'VERTICAL';
  // The default is horizontal, e.g. if the node is not auto-layout.
  if (nodeVertical) {
    primaryAxisFixedSize(node);
  } else {
    counterAxisFixedSize(node);
  }
}

export function primaryAxisFillContainer(node: MyCompNode) {
  node.layoutGrow = 1;
  node.primaryAxisSizingMode = 'FIXED';
}

export function primaryAxisHugContents(node: MyCompNode) {
  node.layoutGrow = 0;
  node.primaryAxisSizingMode = 'AUTO';
}

export function primaryAxisFixedSize(node: MyCompNode) {
  node.layoutGrow = 0;
  node.primaryAxisSizingMode = 'FIXED';
}

export function counterAxisFillContainer(node: MyCompNode) {
  node.layoutAlign = 'STRETCH';
  node.counterAxisSizingMode = 'FIXED';
}

export function counterAxisHugContents(node: MyCompNode) {
  node.layoutAlign = 'INHERIT';
  node.counterAxisSizingMode = 'AUTO';
}

export function counterAxisFixedSize(node: MyCompNode) {
  node.layoutAlign = 'INHERIT';
  node.counterAxisSizingMode = 'FIXED';
}

function checkAndGetParentDirection(node: MyCompNode) {
  if (!node.parent) {
    console.warn('Cannot fill container on top-level nodes. Ignoring call to horizontalFillContainer().');
    return;
  }
  if (!isBaseFrameMixin(node.parent)) {
    console.warn(
      'Cannot fill container on node which parent is not a Frame-like. Ignoring call to horizontalFillContainer().',
    );
    return;
  }
  const parentHorizontal = node.parent.layoutMode === 'HORIZONTAL';
  const parentVertical = node.parent.layoutMode === 'VERTICAL';
  if (!parentHorizontal && !parentVertical) {
    console.warn(
      'Cannot fill container on node which parent is not in auto-layout mode. Ignoring call to horizontalFillContainer().',
    );
    return;
  }
  return parentHorizontal ? 'horizontal' : 'vertical';
}
