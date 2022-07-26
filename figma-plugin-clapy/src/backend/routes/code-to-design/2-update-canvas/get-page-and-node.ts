import { getCompNode } from '../1-import-stories/3-import-sb-detail';
import type { MyCompNode } from '../../../common/node-type-utils';
import { getPageById, isLayout0, isMyComp } from '../../../common/node-type-utils';
import { removeNode, withDefaultProps } from './update-canvas-utils';

export function getPageAndNode(pageId: string, figmaNodeId: string, storyId: string) {
  const page = pageId ? getPageById(pageId) : figma.currentPage;
  let node = figma.getNodeById(figmaNodeId);

  if (!node) {
    console.warn('Node to update not found by Figma ID, checking by storyId.');
    // Passing a container more specific than `page` may optimise a bit.
    node = getCompNode(page, page, storyId);
  }
  if (!node) {
    console.warn('Node to update still not found, ID:', figmaNodeId, '- recreating it.');
    // TODO review with the container logic
    node = withDefaultProps(figma.createFrame());
    node.y = 700;
    page.appendChild(node);
  }
  if (!isLayout0(node)) {
    console.warn('Node to update is not in the layout, skipping. ID:', figmaNodeId);
    return {};
  }
  if (!isMyComp(node)) {
    console.warn('Node is not a frame, recreating it.');
    const f = withDefaultProps(figma.createFrame());
    f.x = node.x;
    f.y = node.y;
    f.name = node.name;
    const parent = node.parent || page;
    const i = parent.children.indexOf(node);

    removeNode(node);
    node = f;
    if (i == null || i === -1) {
      console.warn(
        "Node to update not found in its parent's children or no parent, ID:",
        figmaNodeId,
        '- pushing the new frame at the end of the parent or page.',
      );
      parent.appendChild(node);
    } else {
      parent.insertChild(i, node);
    }
  }
  if (!node.parent) {
    console.error('No node.parent? Something is wrong!');
    return {};
  }

  return { page, node: node as MyCompNode };
}
