import { isStyledTextSegment } from '../backend/common/node-type-utils';
import { apiPost } from './http.utils.js';

export function handleError(error: any) {
  if (error?.message === 'cancelled') {
    return;
  }
  console.error('[handleError]', error);

  // Send the error to the webservice for monitoring.
  let { message, stack } = error;
  const errorStr = JSON.stringify(error);
  const original = JSON.parse(errorStr);
  if (!message) message = errorStr;
  if (!stack) stack = new Error(message).stack;
  const serialized = { message, stack, original };
  apiPost('front-monitor', serialized).catch(err =>
    console.error('Failed to send the error to the webservice. The service may be down.'),
  );
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
