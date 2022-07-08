import { flags } from '../../../common/app-config.js';
import type { Nil } from '../../../common/app-models.js';
import { warnNode } from '../../../common/error-utils';
import { isArrayOf } from '../../../common/general-utils.js';
import type {
  ComponentNode2,
  ComponentNodeNoMethod,
  Dict,
  LayoutTypes,
} from '../../../common/sb-serialize.model';
import { nodeDefaults } from '../../../common/sb-serialize.model';
import {
  isBaseFrameMixin,
  isBlendMixin,
  isChildrenMixin2,
  isComponent2,
  isComponentSet,
  isComponentSet2,
  isInstance2,
  isMinimalFillsMixin,
  isMinimalStrokesMixin,
  isPage2,
  isShapeExceptDivable2,
  isText2,
} from '../../common/node-type-utils';
import { exportNodeTokens2 } from './4-extract-tokens.js';
import { nodeAttributes, rangeProps } from './node-attributes';
import type { AnyNode3, AnyNodeOriginal, ExtractBatchContext, ExtractNodeContext } from './read-figma-config-utils.js';
import {
  checkIsOriginalInstance2,
  isProcessableInstance2,
  patchDimensionFromRotation,
  setProp2,
  shouldGroupAsSVG,
} from './read-figma-config-utils.js';

export function fillNodesCache<T extends AnyNodeOriginal>(nodeOriginal: T, context: ExtractBatchContext): AnyNode3 {
  // It seems reading attributes of Figma nodes have very bad performance impact.
  // Probably because it's not a simple JS object, but a wrapper around something more complex.
  // Let's ensure we read each field only once. For that, we make a copy in an in-memory object.
  // The name "nodeOriginal" is purposely heavy to discourage its usage.

  const id = nodeOriginal.id;
  let type = nodeOriginal.type as LayoutTypes;
  if (!nodeDefaults[type]) {
    warnNode(nodeOriginal, 'Node type is not found in the defaults available. Falling back to Frame defaults.');
    type = 'FRAME';
  }
  const node = { id, type } as AnyNode3;

  // Copy most fields that don't need special processing
  const attributesWhitelist = nodeAttributes[type];
  for (const attribute of attributesWhitelist) {
    try {
      const attr = attribute as keyof AnyNode3;
      const val = (nodeOriginal as any)[attr];
      if (typeof val === 'symbol') {
        (node as any)[attr] = 'Mixed' as any;
      } else {
        (node as any)[attr] = val;
      }
    } catch (err) {
      console.warn('Error reading attribute', attribute, 'on node', nodeOriginal.name, type, id, '-', err);
    }
  }

  // Copy the reference to the parent
  const { parent } = nodeOriginal;
  const { id: parentId, name: parentName, type: parentType } = parent || {};
  if (parentId) {
    node.parent = { id: parentId, name: parentName!, type: parentType as LayoutTypes };
  }

  // Copy componentPropertyDefinitions that is only accessible in special condition, throwing an error otherwise
  const hasComponentPropertyDefinitions =
    isComponentSet2(node) || (isComponent2(node) && !isComponentSet2((node as AnyNode3).parent));
  if (hasComponentPropertyDefinitions) {
    node.componentPropertyDefinitions = (nodeOriginal as ComponentNode | ComponentSetNode).componentPropertyDefinitions;
  }

  // Copy the text segments
  const isTxt = isText2(node);
  if (isTxt) {
    const segments = (nodeOriginal as TextNode).getStyledTextSegments(rangeProps);
    node._textSegments = segments;
  }

  // Copy the Figma Tokens
  const tokens = exportNodeTokens2(nodeOriginal);
  if (tokens) {
    node._tokens = tokens;
    // Should we use setProp here? No real default except undefined, already handled.
  }

  const isBlend = isBlendMixin(node);
  const isMask = isBlend && node.isMask;

  let exportAsSvg =
    (node as AnyNode3).visible &&
    // Instance and component nodes should not be directly exported as SVGs to avoid conflicts with components processing when generating code + avoid the risk of working directly with SVG as root when dealing with component swaps and CSS overrides.
    // It could be changed if we want a component's root node to be the SVG directly, but it would require a bit refactoring.
    !isInstance2(node) &&
    !isComponent2(node) &&
    !isPage2(node) &&
    (isShapeExceptDivable2(node) || isMask || shouldGroupAsSVG(node as AnyNode3));

  if (exportAsSvg) {
    (node as AnyNode3).exportAsSvg = exportAsSvg;
    context.nodeIdsToExtractAsSVG.add(node.id);
  } else {
    const children = (nodeOriginal as ChildrenMixin).children as SceneNode[] | undefined;
    if (children) {
      (node as any).children = children.map(child => fillNodesCache(child, context));
    }
  }

  const { mainComponent: _mainComponent } = nodeOriginal as InstanceNode;
  const mainComponent = _mainComponent!;
  if (isProcessableInstance2(node, mainComponent)) {
    const { componentsCache } = context;
    const { id, parent } = mainComponent;
    if (!componentsCache[id]) {
      const comp = fillNodesCache(mainComponent, context);
      // The cast to unknown may not be required if ComponentNode2 has the parent field like AnyNode3.
      componentsCache[id] = comp as unknown as ComponentNode2;
      const { name, type } = comp;
      node.mainComponent = { id, name, type: type as any } as ComponentNode2;
      if (isComponentSet(parent)) {
        node.mainComponent.parent = parent.id;
      }
    }
  }

  return node as AnyNode3;
}

interface Options {
  skipChildren: boolean;
  skipInstance: boolean;
  skipParent: boolean;
}

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
export function parseConfig<T extends AnyNode3>(node: T, extractBatchContext: ExtractBatchContext) {
  const context: ExtractNodeContext = {
    extractBatchContext,
    node,
  };

  if (flags.verbose && !isComponent2(node)) {
    console.log('Extracting selection', node.name);
  }
  // context = { ...context /* , intermediateNodes: [node] */ };
  return parseNodeConfig(node, context);
}

// let prevNode: AnyNode3 | undefined = undefined;

function parseNodeConfig<T extends AnyNode3>(node: T, context: ExtractNodeContext) {
  try {
    const { extractBatchContext, isComp } = context;
    const { componentsCache, textStyles, fillStyles, strokeStyles, effectStyles, gridStyles } = extractBatchContext;
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
    const { id, type, name } = node;
    let node2 = { id, type, name } as AnyNode3;
    // const nodeIsShape = isShapeExceptDivable(node);
    // let exportAsSvg = nodeIsShape;
    // let obj: any;

    if (isProcessableInst) {
      let { nextIntermediateNode } = context;
      if (!nextIntermediateNode) {
        // If we haven't registered an intermediate node yet, this instance's component is marked as intermediate node.
        nextIntermediateNode = node.mainComponent;
      } else if (!checkIsOriginalInstance2(node, nextIntermediateNode)) {
        // If there was already an intermediate node, now we find another instance, we check if it's the same
        // instance as in the intermediate node. If different, the instance was swapped in Figma.
        // It will be rendered as a render prop in React, which resets the intermediate node to undefined.
        nextIntermediateNode = undefined;
      }

      context = { ...context, nodeOfComp: componentsCache[node.mainComponent.id], nextIntermediateNode };
    }

    const { nodeOfComp, nextIntermediateNode } = context;

    // TODO refactor-rename obj to node2 to remove this extra variable.
    const obj = node2;

    // Let's patch before it is copied and optimized.
    patchDimensionFromRotation(node);

    // perfMeasure(`Time spent - ${prevNode?.name} => ${node.name}`, 0.5);
    // prevNode = node;

    // Copy all fields for optimization (only preserve values that are non-default or different from the component),
    // except for children that will be checked recursively below.
    for (const [attribute, val] of Object.entries(node)) {
      if (attribute !== 'children') {
        setProp2(obj, nodeOfComp, attribute, val);
      }
    }
    // const attributesWhitelist = nodeAttributes[type];
    // for (const attribute of attributesWhitelist) {
    //   const val = (node as any)[attribute];
    //   setProp2(obj, nodeOfComp, attribute, val);
    // }

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
      addStyle(fillStyles, node.fillStyleId);

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
      //
      // nextIntermediateNode de type NodeLight, c'est OK ? Il faut les enfants aussi !
      // TODO
      assertChildrenMixinOrUndef(nextIntermediateNode);

      // TODO check if filter useful
      // .filter(child => !!child)
      (obj as any).children = node.children.map(child => {
        if (nodeOfComp && !isChildrenMixin2(nodeOfComp)) {
          warnNode(node, 'BUG Instance node has children, but the corresponding component node does not.');
          throw new Error('BUG Instance node has children, but the corresponding component node does not.');
        }
        const childContext = {
          ...context,
          nodeOfComp: nodeOfComp?.children[i],
          nextIntermediateNode: nextIntermediateNode?.children[i],
        };
        return parseNodeConfig(child, childContext)
      });
    }

    if (isProcessableInst) {
      const { id, name, type } = node.mainComponent;
      // For MUI, only the parent name is useful.
      // For normal components, only the compoent ID is useful.
      // But we keep id, name, type for both in case we want to do sanity checks.
      obj.mainComponent = { id, name, type };
      if (isComponentSet(node.mainComponent.parent)) {
        const { id, name, type } = node.mainComponent.parent;
        obj.mainComponent.parent = { id, name, type };
      }
      if (!context.components[id]) {
        // We should assign a component, but it is only available after the await below. And we use the dictionary to prevent double processing. We set a boolean for the moment to prevent the double processing, and once we have the component, it is assigned instead.
        context.components[id] = true as any;
        const { nodeOfComp, ...compContext } = context;
        compContext.isComp = true;
        compContext.intermediateNodes = [node.mainComponent];
        const comp = (await parseNodeConfig(node.mainComponent, compContext, options)) as
          | ComponentNodeNoMethod
          | undefined;
        if (comp) {
          if (context.components[id]) {
            console.warn('Component', comp.name, 'already referenced. It was certainly processed twice.');
          }
          context.components[id] = comp;
        } else {
          // If undefined, there was an error (processed separately). Remove from the dictionary of components.
          console.warn(
            'Component for node ',
            node.mainComponent.name,
            'is undefined. There was certainly an error. Removing from the components map.',
          );
          delete context.components[id];
        }
      }
    }
    // If we need to debug symbols:
    // for (const [key, val] of Object.entries(obj)) {
    //   if (typeof val === 'symbol') {
    //     throw new Error(`Symbol found, key ${key}, val ${String(val)}`);
    //   }
    // }
    return obj as SceneNodeNoMethod;
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

// Assertion in control flow analysis
function assertChildrenMixinOrUndef(node: BaseNode | ChildrenMixin | Nil): asserts node is ChildrenMixin | undefined {
  if (node && !isChildrenMixin(node)) {
    throw new Error(`node ${(node as BaseNode).name} is not a ChildrenMixin`);
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
