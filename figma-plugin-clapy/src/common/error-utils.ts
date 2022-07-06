import { isStyledTextSegment } from '../backend/common/node-type-utils';

export function handleError(error: any) {
  if (error?.message === 'cancelled') {
    return;
  }
  console.error('[handleError]', error);
}

export function warnNode(node: SceneNode | PageNode | StyledTextSegment | DocumentNode, ...msg: any[]) {
  if (isStyledTextSegment(node)) {
    console.warn(...msg, node.characters);
  } else {
    const { name, type, id } = node;
    let name2 = name;
    while (node.parent) {
      node = node.parent;
      if (node) {
        name2 = `${node.name} > ${name2}`;
      }
    }
    console.warn(...msg, name2, type, id);
  }
}
