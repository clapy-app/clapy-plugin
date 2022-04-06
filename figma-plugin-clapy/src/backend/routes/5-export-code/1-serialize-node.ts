import CryptoJS from 'crypto-js';

import { ExportImages } from '../../../common/app-models';
import { isExportMixin } from '../../common/node-type-utils';
import { getFigmaSelection } from '../../common/selection-utils';
import { nodeToObject, SerializeContext } from './nodeToObject';

export function serializeSelectedNode() {
  const selection = getFigmaSelection();
  if (selection?.length !== 1) {
    throw new Error('Selection is not exactly one node, which is not compatible with serialization.');
  }
  const node = selection[0];
  // We could first check something like getParentCompNode(selectedNode).node in case we want to reuse the notion of components from code>design.

  const images: ExportImages = [];
  const context: SerializeContext = { images };

  return Promise.all([
    node.parent
      ? nodeToObject(node.parent as SceneNode, context, { skipChildren: true, skipInstance: true, skipParent: true })
      : null,
    nodeToObject(node, context, { skipChildren: false, skipInstance: true, skipParent: true }),
    images,
  ]);
}

export async function extractImage(nodeId: string) {
  const node = figma.getNodeById(nodeId);
  if (!node || !isExportMixin(node)) return [null, null];
  const fileUint = await node.exportAsync({
    format: 'JPG',
    useAbsoluteBounds: true,
  });
  // If sent as object, it's complex to convert to ArrayBuffer. And ArrayBuffer cannot be sent directly here.
  // With an array, we can recreate the Uint8Array in the front, then read the ArrayBuffer, then send to Cloudinary.
  const image = Array.from(fileUint);
  const wordArray = uint8ArrayToWordArray(fileUint);
  const hash = CryptoJS.SHA256(wordArray).toString();
  return [image, hash] as const;
}

// Source: https://stackoverflow.com/a/33918579/4053349
function uint8ArrayToWordArray(i8a: Uint8Array) {
  var a = [];
  for (var i = 0; i < i8a.length; i += 4) {
    a.push((i8a[i] << 24) | (i8a[i + 1] << 16) | (i8a[i + 2] << 8) | i8a[i + 3]);
  }
  return CryptoJS.lib.WordArray.create(a, i8a.length);
}
