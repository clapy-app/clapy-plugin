import type {
  ComponentNodeNoMethod,
  FrameNodeNoMethod,
  InstanceNodeNoMethod,
  PageNodeNoMethod,
} from '../../../common/sb-serialize.model.js';
import { env } from '../../../environment/env.js';
import { perfMeasure, perfReset } from '../../common/perf-utils';
import { getFigmaSelection } from '../../common/selection-utils';
import type { SerializeContext } from './3-nodeToObject.js';
import { nodeToObject } from './3-nodeToObject.js';
import { extractFigmaTokens } from './4-extract-tokens.js';
import { fillNodesCache, parseConfig } from './5-read-figma-config.js';
import type { AnyNode3, ExtractBatchContext } from './read-figma-config-utils.js';

const newWorkflow = false;

export async function serializeSelectedNode() {
  perfReset();
  const selection = getFigmaSelection();
  if (selection?.length !== 1) {
    throw new Error('Selection is not exactly one node, which is not compatible with serialization.');
  }
  const node = selection[0];
  // We could first check something like getParentCompNode(selectedNode).node in case we want to reuse the notion of components from code>design.

  if (newWorkflow) {
    const extractBatchContext: ExtractBatchContext = {
      images: {},
      components: {},
      componentsToProcess: [node],
      componentsCache: {},
      componentsCallbacks: {},
      textStyles: {},
      fillStyles: {},
      strokeStyles: {},
      effectStyles: {},
      gridStyles: {},
      nodeIdsToExtractAsSVG: new Set(),
      imageHashesToExtract: new Set(),
    };
    perfMeasure('Start fillNodesCache');
    const nodes: AnyNode3[] = [];
    for (const compToProcess of extractBatchContext.componentsToProcess) {
      nodes.push(fillNodesCache(compToProcess, extractBatchContext));
      perfMeasure(`End fillNodesCache for node ${compToProcess.name}`);
    }
    console.log(JSON.stringify(nodes));
    console.log('Start parseConfig');

    const [mainNode, ...components2] = nodes.map(node => parseConfig(node, extractBatchContext));
    perfMeasure('End parseConfig');

    // console.log(JSON.stringify(mainNode));
    // components2

    return [undefined, undefined, undefined, undefined, undefined, undefined, undefined] as const;
  } else {
    const context: SerializeContext = {
      images: {},
      components: {},
      textStyles: {},
      fillStyles: {},
      strokeStyles: {},
      effectStyles: {},
      gridStyles: {},
      intermediateNodes: [],
    };

    const extraConfig = {
      ...(env.isDev
        ? {
            isClapyFile: figma.fileKey === 'Bdl7eeSo61mEXcFs5sgD7n',
          }
        : {}),
      isFTD: figma.root.name?.includes('Clapy — Token demo file'),
    };

    const tokens = extractFigmaTokens();

    const enableMUIFramework = true;
    // Later, once variants are handled, we will use instances as well, but differently?
    const skipInstance = !enableMUIFramework;
    const [parentConf, nodesConf] = await Promise.all([
      node.parent
        ? (nodeToObject(node.parent as SceneNode, context, {
            skipChildren: true,
          }) as Promise<
            FrameNodeNoMethod | ComponentNodeNoMethod | InstanceNodeNoMethod | PageNodeNoMethod | undefined
          >)
        : null,
      nodeToObject(node, context, { skipChildren: false, skipInstance }),
    ]);
    const { images, textStyles, fillStyles, strokeStyles, effectStyles, gridStyles } = context;
    const styles = { textStyles, fillStyles, strokeStyles, effectStyles, gridStyles };

    return [extraConfig, parentConf, nodesConf, Object.values(context.components), images, styles, tokens] as const;
  }
}

// Let's keep this code for now, it's useful to extract images and upload to CDN.
// BUT we'll need to adapt it: an image hash is already available in each fill, and we can retrieve the original image bytes with a method like figma.getImageByHash (not sure of the method name).

// export async function extractImage(nodeId: string) {
//   const node = figma.getNodeById(nodeId);
//   if (!node || !isExportMixin(node)) return [null, null];
//   const fileUint = await node.exportAsync({
//     format: 'JPG',
//     useAbsoluteBounds: true,
//   });
//   if (isMinimalFillsMixin(node) && Array.isArray(node.fills)) {
//     for (const fill of node.fills as Paint[]) {
//       if (fill.type === 'IMAGE') {
//         // fill.imageHash
//       }
//     }
//   }
//   // If sent as object, it's complex to convert to ArrayBuffer. And ArrayBuffer cannot be sent directly here.
//   // With an array, we can recreate the Uint8Array in the front, then read the ArrayBuffer, then send to Cloudinary.
//   const image = Array.from(fileUint);
//   const wordArray = uint8ArrayToWordArray(fileUint);
//   const hash = CryptoJS.SHA256(wordArray).toString();
//   return [image, hash] as const;
// }

// // Source: https://stackoverflow.com/a/33918579/4053349
// function uint8ArrayToWordArray(i8a: Uint8Array) {
//   var a = [];
//   for (var i = 0; i < i8a.length; i += 4) {
//     a.push((i8a[i] << 24) | (i8a[i + 1] << 16) | (i8a[i + 2] << 8) | i8a[i + 3]);
//   }
//   return CryptoJS.lib.WordArray.create(a, i8a.length);
// }

// (async function () {
//   const textNodeId = 'I2:220;36:197';
//   const node = figma.getNodeById(textNodeId);
//   if (isText(node) && typeof node.fillStyleId === 'string') {
//     console.log(figma.getStyleById(node.fillStyleId));

//     // const styleKey = '4ca80dd1008a54f04f9b20a14109e02e6c1aac5a';
//     // const style = await figma.importStyleByKeyAsync(styleKey);
//     // console.log('style 2 :');
//     // console.log(style);
//   } else {
//     console.log('Not a text node');
//   }
// })().catch(err => console.error(err));

// figma.getStyleById
// figma.importStyleByKeyAsync
