import { flags } from '../../../common/app-config.js';
import { handleError, warnNode } from '../../../common/error-utils.js';
import { isArrayOf } from '../../../common/general-utils.js';
import type { Dict } from '../../../common/sb-serialize.model.js';
import { env } from '../../../environment/env.js';
import {
  isBaseFrameMixin,
  isBlendMixin,
  isChildrenMixin2,
  isComponent2,
  isComponentSet2,
  isMinimalFillsMixin,
  isMinimalStrokesMixin,
  isText2,
} from '../../common/node-type-utils.js';
import type { AnyNode3, ExtractBatchContext, ExtractNodeContext } from './read-figma-config-utils.js';
import {
  checkIsOriginalInstance2,
  isProcessableInstance2,
  patchDimensionFromRotation,
  setProp2,
} from './read-figma-config-utils.js';

/**
 * Transform node to object with keys, that are hidden by default.
 * @example
 * ```ts
 * const node = figma.currentPage.findOne((el) => el.type === "TEXT");
 * console.log(Object.keys(node).length) // 1
 * console.log(Object.keys(nodeToObject(node)).length) // 42
 * console.log(Object.keys(nodeToObject(node, true)).length) // 39
 * ```
 *
 * @param node
 * @param options
 */
export function optimizeConfig<T extends AnyNode3>(node: T, extractBatchContext: ExtractBatchContext) {
  const context: ExtractNodeContext = {
    extractBatchContext,
    node,
  };
  const { parent } = node;
  if (parent) {
    node.parent = optimizeNodeConfig(parent as AnyNode3, context);
  }

  return optimizeNodeConfig(node, context);
}

function optimizeNodeConfig<T extends AnyNode3>(node: T, context: ExtractNodeContext) {
  try {
    const { extractBatchContext } = context;
    const { componentsCache } = extractBatchContext;
    if (flags.verbose) {
      if (isComponent2(node)) {
        console.log(
          'Extracting component',
          isComponentSet2(node.parent) ? `${node.parent.name} (variant ${node.name})` : node.name,
        );
      } else {
        console.log('Extracting node', node.name);
      }
    }
    const isProcessableInst = isProcessableInstance2(node);

    if (isProcessableInst) {
      const nodeOfComp = componentsCache[node.mainComponent.id];
      let { nextIntermediateNode } = context;
      if (!nextIntermediateNode) {
        // If we haven't registered an intermediate node yet, this instance's component is marked as intermediate node.
        nextIntermediateNode = nodeOfComp;
      } else if (!checkIsOriginalInstance2(node, nextIntermediateNode)) {
        // If there was already an intermediate node, now we find another instance, we check if it's the same
        // instance as in the intermediate node. If different, the instance was swapped in Figma.
        // It will be rendered as a render prop in React, which resets the intermediate node to undefined.
        nextIntermediateNode = undefined;
      }

      context = { ...context, nodeOfComp, nextIntermediateNode };
    }

    const { nodeOfComp, nextIntermediateNode } = context;

    // Let's patch before it is copied and optimized.
    patchDimensionFromRotation(node);

    const { id, type, name } = node;
    let node2 = { id, type, name } as T;

    // perfMeasure(`Time spent - ${prevNode?.name} => ${node.name}`, 0.5);
    // prevNode = node;

    // Copy all fields for optimization (only preserve values that are non-default or different from the component),
    // except for children that will be checked recursively below.
    for (const [attribute, val] of Object.entries(node)) {
      if (attribute !== 'children') {
        setProp2(node2, nodeOfComp, attribute, val);
      }
    }

    const { exportAsSvg } = node;

    const isBlend = isBlendMixin(node);
    const isMask = isBlend && node.isMask;

    if (isMask) {
      addStyle(extractBatchContext.effectStyles, node.effectStyleId);
    }

    if (isMinimalStrokesMixin(node)) {
      addStyle(extractBatchContext.strokeStyles, node.strokeStyleId);
    }

    if (isBaseFrameMixin(node)) {
      addStyle(extractBatchContext.gridStyles, node.gridStyleId);
    }

    const isTxt = isText2(node);

    if (isTxt && node._textSegments) {
      for (const { textStyleId, fillStyleId } of node._textSegments) {
        addStyle(extractBatchContext.textStyles, textStyleId);
        addStyle(extractBatchContext.fillStyles, fillStyleId);
      }
    }

    if (!exportAsSvg && !isTxt && isMinimalFillsMixin(node) && isArrayOf<Paint>(node.fills)) {
      // Fills can be mixed if node is Text. Ignore it, text segments are already processed earlier.
      addStyle(extractBatchContext.fillStyles, node.fillStyleId);

      for (const fill of node.fills) {
        if (fill.type === 'IMAGE') {
          if (!fill.imageHash) {
            warnNode(
              node,
              'BUG Image fill has no hash, to check and understand why. Ignoring image:',
              JSON.stringify(fill),
            );
          } else {
            extractBatchContext.imageHashesToExtract.add(fill.imageHash);
          }
        }
      }
    }

    if (isChildrenMixin2(node) && !exportAsSvg) {
      if (nodeOfComp && !isChildrenMixin2(nodeOfComp)) {
        warnNode(node, 'BUG Instance node has children, but the corresponding component node does not.');
        throw new Error('BUG Instance node has children, but the corresponding component node does not.');
      }
      if (nextIntermediateNode && !isChildrenMixin2(nextIntermediateNode)) {
        warnNode(node, 'BUG Instance node has children, but nextIntermediateNode does not.');
        throw new Error('BUG Instance node has children, but nextIntermediateNode does not.');
      }

      // TODO check if filter useful
      // .filter(child => !!child)
      (node2 as any).children = node.children.map((child, i) => {
        const childContext = {
          ...context,
          nodeOfComp: nodeOfComp?.children[i],
          nextIntermediateNode: nextIntermediateNode?.children[i],
        };
        return optimizeNodeConfig(child, childContext);
      });
    }

    return node2;
  } catch (error: any) {
    if (typeof error === 'string') {
      error = new Error(error);
    }
    const nodeName = error.nodeName ? `${node.name} > ${error.nodeName}` : node.name;
    Object.assign(error, { nodeName: nodeName });
    if (!env.isProd) {
      throw error;
    }
    // Production: don't block the process
    handleError(error);
    return;
  }
}

function addStyle<TStyle extends BaseStyle>(styles: Dict<TStyle>, styleId: string | typeof figma.mixed) {
  if (typeof styleId === 'string') {
    const styleFull = figma.getStyleById(styleId);
    if (styleFull && !styles[styleId]) {
      const style: Dict<any> = {};
      const props = Object.entries(Object.getOwnPropertyDescriptors((styleFull as any).__proto__));
      for (const [name, prop] of props) {
        // Remove ID to make the JSON smaller because it's already available as key in the style dictionary.
        if (name === 'id') continue;

        const val = prop.get?.call(styleFull);
        try {
          if (val) {
            if (typeof val === 'symbol') {
              style[name] = 'Mixed';
            } else {
              style[name] = val;
            }
          }
        } catch (err) {
          console.warn('Failed to assign value', name);
          // style2[name] = undefined;
        }
      }

      styles[styleId] = style as TStyle;
    }
  }
}
