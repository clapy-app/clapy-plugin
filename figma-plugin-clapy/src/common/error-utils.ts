import { isStyledTextSegment } from '../backend/common/node-type-utils';

export function handleError(error: any) {
  if (error?.message === 'cancelled') {
    return;
  }
  console.error('[handleError]', error);
}

export function warnNode(node: SceneNode | StyledTextSegment | PageNode, ...msg: any[]) {
  if (isStyledTextSegment(node)) {
    console.warn(...msg, node.characters);
  } else {
    console.warn(...msg, node.name, node.type, node.id);
  }
}
