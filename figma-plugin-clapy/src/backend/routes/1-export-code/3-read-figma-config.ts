import { flags } from '../../../common/app-config.js';
import { warnNode } from '../../../common/error-utils';
import type { ComponentNode2, LayoutTypes } from '../../../common/sb-serialize.model';
import { nodeDefaults } from '../../../common/sb-serialize.model';
import {
  isBlendMixin,
  isComponent2,
  isComponentSet,
  isComponentSet2,
  isGroup2,
  isInstance2,
  isPage2,
  isShapeExceptDivable2,
  isText2,
} from '../../common/node-type-utils';
import { exportNodeTokens2 } from './9-extract-tokens.js';
import { nodeAttributes, rangeProps } from './node-attributes';
import type { AnyNode3, AnyNodeOriginal, AnyParent, ExtractBatchContext } from './read-figma-config-utils.js';
import { isProcessableInstance2, shouldGroupAsSVG } from './read-figma-config-utils.js';

export function readParentNodeConfig<T extends AnyNodeOriginal>(nodeOriginal: T) {
  // Possible optimization: only extract the fields that are useful for the parent. Some of the fields I've listed from the webservice:
  // name, type, layoutMode, x, y, width, height, clipsContent, styles, children
  return commonFigmaConfigExtraction(nodeOriginal) as AnyParent;
}

function commonFigmaConfigExtraction<T extends AnyNodeOriginal>(nodeOriginal: T) {
  // Part that is common to the parent node and the main node + sub-components.
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

  // Copy the Figma Tokens
  const tokens = exportNodeTokens2(nodeOriginal);
  if (tokens) {
    node._tokens = tokens;
    // Should we use setProp here? No real default except undefined, already handled.
  }

  return node;
}

export function readFigmaNodesConfig<T extends AnyNodeOriginal>(
  context: ExtractBatchContext,
  nodeOriginal: T,
  parent: AnyParent | undefined,
): AnyNode3 {
  // It seems reading attributes of Figma nodes have very bad performance impact.
  // Probably because it's not a simple JS object, but a wrapper around something more complex.
  // Let's ensure we read each field only once. For that, we make a copy in an in-memory object.
  // The name "nodeOriginal" is purposely heavy to discourage its usage.

  const node = commonFigmaConfigExtraction(nodeOriginal);
  const { id } = node;

  // Copy the reference to the parent
  const { id: parentId, name: parentName, type: parentType } = parent || {};
  if (parentId) {
    node.parent = context.isRootNodeInComponent
      ? parent
      : { id: parentId, name: parentName!, type: parentType as LayoutTypes };
  }

  const nodeIsComp = isComponent2(node);

  // Copy componentPropertyDefinitions that is only accessible in special condition, throwing an error otherwise
  const hasComponentPropertyDefinitions =
    isComponentSet2(node) || (nodeIsComp && !isComponentSet2((node as AnyNode3).parent));
  if (hasComponentPropertyDefinitions) {
    node.componentPropertyDefinitions = (nodeOriginal as ComponentNode | ComponentSetNode).componentPropertyDefinitions;
  }

  // Copy the text segments
  const isTxt = isText2(node);
  if (isTxt) {
    const segments = (nodeOriginal as TextNode).getStyledTextSegments(rangeProps);
    node._textSegments = segments;
  }

  const isBlend = isBlendMixin(node);
  const isMask = isBlend && node.isMask;
  const isInst = isInstance2(node);

  const vectorRequirement = (flags.groupSvgInCompInstance || (!isInst && !nodeIsComp)) && !isPage2(node);

  const svgExportCandidate =
    vectorRequirement && (isShapeExceptDivable2(node) || isMask || shouldGroupAsSVG(nodeOriginal));

  // Instance and component nodes should not be directly exported as SVGs to avoid conflicts with components processing when generating code + avoid the risk of working directly with SVG as root when dealing with component swaps and CSS overrides.
  // It could be changed if we want a component's root node to be the SVG directly, but it would require a bit refactoring.
  const changeToVector = svgExportCandidate && !isInst && !nodeIsComp;

  if (changeToVector) {
    node.type = 'VECTOR';
  }

  // Let's skip the export of hidden SVGs.
  let exportAsSvg = (node as AnyNode3).visible && svgExportCandidate;

  if (exportAsSvg) {
    (node as AnyNode3).exportAsSvg = exportAsSvg;
    if (isGroup2(node)) {
      const children = (nodeOriginal as ChildrenMixin).children as SceneNode[] | undefined;
      if (children) {
        // Interesting properties like constraints are in the children nodes. Let's make a copy.
        (node as any).constraints = (children[0] as ConstraintMixin)?.constraints;
      }
    }
    context.nodeIdsToExtractAsSVG.add(node.id);
  } else if (!svgExportCandidate) {
    const children = (nodeOriginal as ChildrenMixin).children as SceneNode[] | undefined;
    if (children) {
      // Another way to iterate to try, using generators, that might be a bit faster (to compare):
      // https://forum.figma.com/t/figma-layers-tree-traversal-estimating-size/551/4
      const contextForChildren: ExtractBatchContext = {
        ...context,
        isRootNodeInComponent: false,
      };
      (node as any).children = children.map(child =>
        readFigmaNodesConfig(contextForChildren, child, node as AnyParent),
      );
    }
  }

  if (nodeIsComp) {
    if (!context.componentsCache[id]) {
      context.componentsCache[id] = node as ComponentNode2;
    }
  }

  const { componentsCallbacks } = context;
  const { mainComponent: _mainComponent } = nodeOriginal as InstanceNode;
  if (isProcessableInstance2(node, _mainComponent)) {
    const mainComponent = _mainComponent!;
    const { id } = mainComponent;

    if (!componentsCallbacks[id]) {
      componentsCallbacks[id] = [];
      context.componentsToProcess.push(mainComponent);
    }

    // Linking is delayed in callbacks because the instance component may not have been processed yet (missing in componentsCache).
    componentsCallbacks[id].push(comp => {
      const { name, type } = comp;
      node.mainComponent = { id, name, type: type as any } as ComponentNode2;
      const parent = (comp as AnyNode3).parent;
      if (isComponentSet(parent)) {
        node.mainComponent.parent = parent.id;
      }
    });
  }

  return node as AnyNode3;
}

export function linkInstancesToComponents(context: ExtractBatchContext) {
  const { componentsCallbacks, componentsCache } = context;
  for (const [compId, callback] of Object.entries(componentsCallbacks)) {
    if (!componentsCache[compId]) {
      console.warn(
        'Component',
        compId,
        'found in componentsCallbacks, but not componentsCache. Skip linking the instances to this component.',
      );
      continue;
    }
    const comp = componentsCache[compId];
    for (const callback of componentsCallbacks[compId]) {
      callback(comp);
    }
  }
}
