import { isStyledTextSegment } from '../backend/common/node-type-utils';

// Separate from handleError because it doesn't send HTTP requests. The plugin back is not able to send requests.
export function handleErrorBack(error: any) {
  if (error?.message === 'cancelled') {
    return;
  }
  console.error('[handleError]', error);
}

// toastError in src/common/front-utils.tsx

// AnyNode3 is generating weird typing errors below I don't understand: the guard isStyledTextSegment doesn't work anymore and the type StyledTextSegment is still there in the `else` body, resulting in errors like node.parent KO.
// To allow using warnNode with AnyNode3, we use any instead (workaround).
export function warnNode(
  node: any /* | SceneNode | PageNode | StyledTextSegment | DocumentNode */ /* | AnyNode3 */,
  ...msg: any[]
) {
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
