import { flags } from '../../../common/app-config.js';
import { warnNode } from '../../../common/error-utils.js';
import { isArrayOf } from '../../../common/general-utils.js';
import type { SVGsExtracted } from '../../../common/sb-serialize.model.js';
import { isLayout0, isMinimalStrokesMixin } from '../../common/node-type-utils.js';
import { perfReset } from '../../common/perf-utils.js';
import { removeNode } from '../code-to-design/2-update-canvas/update-canvas-utils.js';
import type { AnyNodeOriginal } from './read-figma-config-utils.js';
import { utf8ArrayToStr } from './Utf8ArrayToStr.js';

type Fills = readonly Paint[];
type FillsOrUndef = Fills | undefined;

export async function extractSVGs(nodeIdsToExtractAsSVG: string[]) {
  const svgs = await Promise.all(
    nodeIdsToExtractAsSVG.map(nodeId => extractSVG(nodeId).then(svg => ({ nodeId, svg }))),
  );
  const svgsDict: SVGsExtracted = {};
  for (const { nodeId, svg } of svgs) {
    if (svg) {
      svgsDict[nodeId] = svg;
    }
  }
  return svgsDict;
}

async function extractSVG(nodeIdToExtractAsSVG: string) {
  perfReset();
  const svgNode = figma.getNodeById(nodeIdToExtractAsSVG) as AnyNodeOriginal | null;
  if (!svgNode) {
    throw new Error(`Node with ID ${nodeIdToExtractAsSVG} not found, cannot export as SVG.`);
  }
  if (!isLayout0(svgNode) || svgNode.absoluteRenderBounds == null) {
    return;
  }

  const svgNode2 = svgNode.clone();
  try {
    // Masks cannot be directly exported as SVG. So we make a copy and disable the mask on it to export as SVG.
    // In the finally clause, this copy is removed. Source nodes must be treated as readonly since they can be
    // inside instances of components.
    if ((svgNode2 as BlendMixin).isMask) {
      (svgNode2 as BlendMixin).isMask = false;
      const svgNode2WithFills = svgNode2 as MinimalFillsMixin;
      const fills = svgNode2WithFills.fills as FillsOrUndef;
      if (isArrayOf<Paint>(fills)) {
        // Only keep a black fill (in case there was an image or anything heavy and irrelevant).
        // Well, images with transparency would be useful. Later.
        svgNode2WithFills.fills = [
          {
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0 },
          },
        ];
      }
    }

    const effects = (svgNode2 as BlendMixin).effects;
    if (effects?.length) {
      (svgNode2 as BlendMixin).effects = [];
      (svgNode2 as BlendMixin).effectStyleId = '';
    }

    // Change all stroke positions to center to fix the bad SVG export bug
    fixStrokeAlign(svgNode2);

    // TextDecoder is undefined, I don't know why. We are supposed to be in a modern JS engine. So we use a JS replacement instead.
    // But ideally, we should do:
    // obj._svg = new TextDecoder().decode(await nodeToExport.exportAsync({ format: 'SVG' }));

    try {
      const svg = utf8ArrayToStr(await svgNode2.exportAsync({ format: 'SVG', useAbsoluteBounds: true }));
      return { svg, name: svgNode2.name };
    } catch (error) {
      warnNode(svgNode, 'Failed to export node as SVG, ignoring.');
      console.error(error);
    }
  } finally {
    removeNode(svgNode2);
  }
}

// Source: https://forum.figma.com/t/svg-export-issue/3424/6
function fixStrokeAlign(node: SceneNode) {
  try {
    if (!flags.fixSvgStrokePositionBug) return;
    if (isMinimalStrokesMixin(node)) {
      node.strokeAlign = 'CENTER';
    }

    const children = (node as ChildrenMixin).children as SceneNode[] | undefined;
    if (children) {
      for (const child of children) {
        fixStrokeAlign(child);
      }
    }
  } catch (error) {
    warnNode(
      node,
      'Fix stroke align failed. Maybe the node is a read-only component in another file. To fix later by copying it here in addition to the top level node copy.',
    );
  }
}
