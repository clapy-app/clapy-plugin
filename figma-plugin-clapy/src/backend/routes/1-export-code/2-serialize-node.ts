import type { ExtractionProgress, NextFn } from '../../../common/app-models';
import { wait } from '../../../common/general-utils.js';
import type { ComponentNode2 } from '../../../common/sb-serialize.model.js';
import { env } from '../../../environment/env.js';
import { isComponentSet } from '../../common/node-type-utils.js';
import { perfMeasure, perfReset } from '../../common/perf-utils';
import { getFigmaSelection } from '../../common/selection-utils';
import { linkInstancesToComponents, readFigmaNodesConfig, readParentNodeConfig } from './3-read-figma-config.js';
import { optimizeConfig } from './4-optimize-config.js';
import { extractFigmaTokens } from './9-extract-tokens.js';
import type { AnyNode3, ExtractBatchContext } from './read-figma-config-utils.js';

let _notifyProgress: ((progress: ExtractionProgress) => void) | undefined;

export function figmaConfigExtractionProgress(next: NextFn<ExtractionProgress>) {
  _notifyProgress = async (progress: ExtractionProgress) => next(progress);
}

async function notifyProgress(progress: ExtractionProgress, node?: SceneNode) {
  await wait();
  if (node) {
    let nodeName = node.name;
    const parent = node?.parent;
    if (isComponentSet(parent)) {
      nodeName = `${parent.name} - ${nodeName}`;
    }
    progress.nodeName = `Component: ${nodeName}`;
  }
  _notifyProgress?.(progress);
}

export async function serializeSelectedNode() {
  perfReset();
  const selection = getFigmaSelection();
  if (selection?.length !== 1) {
    throw new Error('Selection is not exactly one node, which is not compatible with serialization.');
  }
  const node = selection[0];
  // We could first check something like getParentCompNode(selectedNode).node in case we want to reuse the notion of components from code>design.

  const nodeParent = node.parent as SceneNode | undefined;
  if (nodeParent) {
    await notifyProgress({ stepId: 'readFigmaNodesConfig', stepNumber: 2 }, nodeParent);
  }
  const parentConfig = nodeParent ? readParentNodeConfig(nodeParent) : undefined;

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
  perfMeasure('Start readFigmaNodesConfig');

  // Tip to unfreeze a bit the UI, the time to show the progress:
  // await wait(0) or a bit more than 0, to let the UI refresh.
  // Example, run it every 100 nodes processed
  // idea from: https://forum.figma.com/t/figma-layers-tree-traversal-estimating-size/551/6

  const nodes: AnyNode3[] = [];
  for (const compToProcess of extractBatchContext.componentsToProcess) {
    await notifyProgress({ stepId: 'readFigmaNodesConfig', stepNumber: 2 }, compToProcess);
    nodes.push(readFigmaNodesConfig(compToProcess, extractBatchContext));
    perfMeasure(`End readFigmaNodesConfig for node ${compToProcess.name}`);
  }

  await notifyProgress({ stepId: 'optimizeConfig', stepNumber: 3 });
  linkInstancesToComponents(extractBatchContext);
  perfMeasure('End linkInstancesToComponents');

  const [mainNode, ...components2] = nodes.map(node => optimizeConfig(node, extractBatchContext));
  const components3 = components2.filter(c => c) as ComponentNode2[];
  perfMeasure('End optimizeConfig');

  await notifyProgress({ stepId: 'extractTokens', stepNumber: 4 });
  const tokens = extractFigmaTokens();
  perfMeasure('End extracting Figma Tokens global config');

  const extraConfig = {
    ...(env.isDev
      ? {
          isClapyFile: figma.fileKey === 'Bdl7eeSo61mEXcFs5sgD7n',
        }
      : {}),
    isFTD: figma.root.name?.includes('Clapy — Token demo file'),
  };
  perfMeasure('End prepare extra config');

  // console.log(JSON.stringify(mainNode));
  // console.log('--------------------');
  // console.log(JSON.stringify(components3));

  const { images, nodeIdsToExtractAsSVG, imageHashesToExtract } = extractBatchContext;
  const { textStyles, fillStyles, strokeStyles, effectStyles, gridStyles } = extractBatchContext;
  const styles = { textStyles, fillStyles, strokeStyles, effectStyles, gridStyles };

  return {
    extraConfig,
    parent: parentConfig,
    root: mainNode,
    components: components3,
    nodeIdsToExtractAsSVG: Array.from(nodeIdsToExtractAsSVG),
    imageHashesToExtract: Array.from(imageHashesToExtract),
    // imagesExtracted: undefined,
    styles,
    tokens,
  } as const;

  // TODO test that the extracted config is ready, then:
  // TODO it's still missing svg and images extraction

  // return [undefined, undefined, undefined, undefined, undefined, undefined, undefined] as const;
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
