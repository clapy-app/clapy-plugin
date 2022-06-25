import { DeclarationPlain } from 'css-tree';
import equal from 'fast-deep-equal';

import { flags } from '../../env-and-config/app-config';
import { env } from '../../env-and-config/env';
import { handleError, warnOrThrow } from '../../utils';
import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { getOrGenComponent } from './3-gen-component';
import { mapCommonStyles, mapTagStyles, postMapStyles } from './6-figma-to-code-map';
import { InstanceContext, JsxOneOrMore, ModuleContext, SwapAst, SwapContext } from './code.model';
import { writeAsset } from './create-ts-compiler/2-write-asset';
import {
  assertChildrenMixin,
  assertInstance,
  ChildrenMixin2,
  FlexNode,
  GroupNode2,
  InstanceNode2,
  isBlendMixin,
  isBlockNode,
  isChildrenMixin,
  isFlexNode,
  isFrame,
  isGroup,
  isInstance,
  isText,
  isValidNode,
  isVector,
  Masker,
  SceneNode2,
  TextNode2,
  ValidNode,
} from './create-ts-compiler/canvas-utils';
import { printStandalone } from './create-ts-compiler/parsing.utils';
import { mergeWithInheritedStyles } from './css-gen/css-factories-high';
import { stylesToList } from './css-gen/css-type-utils';
import { instanceToCompIndexRemapper } from './gen-node-utils/default-node';
import { readSvg } from './gen-node-utils/process-nodes-utils';
import { genTextAst, prepareStylesOnTextSegments } from './gen-node-utils/text-utils';
import {
  addCssRule,
  checkIsOriginalInstance,
  createComponentUsageWithAttributes,
  fillIsRootInComponent,
  getOrCreateCompContext,
  getOrGenClassName,
  getOrGenHideProp,
  getOrGenSwapName,
  getOrGenTextOverrideProp,
  removeCssRule,
  updateCssRuleClassName,
} from './gen-node-utils/ts-ast-utils';
import { warnNode } from './gen-node-utils/utils-and-reset';

export function genInstanceOverrides(context: InstanceContext, node: SceneNode2) {
  try {
    const { parentNode, moduleContext, componentContext, nodeOfComp, isRootInComponent } = context;
    if (!isRootInComponent) {
      // The root node is an instance node, also used where the instance is used, and a context is already attached there.
      // It shouldn't be overridden, otherwise we get a wrong node.isRootInComponent in the instance usage.
      // (E.g. it wraps instances with <></> as if it was a root node)
      node.nodeContext = context;
    }
    fillIsRootInComponent(moduleContext, node);

    let styles: Dict<DeclarationPlain> = {};

    if (!node.visible && context.isRootInComponent) {
      // It happens, we stop here. We may just need to ensure the instance node has a hideProp true on it.
      return;
    }
    addHideOverride(context, node);
    if (!node.visible) {
      return;
    }

    if (!isRootInComponent) {
      // There can't be a component inside a component (Figma makes it impossible),
      // Nor a component inside an instance.
      // const isComp = isComponent(node);
      const isInst = isInstance(node);
      const compNodeIsInstance = isInstance(nodeOfComp);
      if (isInst && !compNodeIsInstance) {
        throw new Error(
          'BUG Instance in instance found, but the original sub component does not have an instance at the same location.',
        );
      }
      if (isInst && compNodeIsInstance) {
        // We found a sub-instance. The current instance is an intermediate layer. The sub-instance potentially also has overrides we need to find and bind to the top-level instance and pass props through all layers.

        const isOriginalInstance = !node.swapOfNode; // = not swapped in Figma
        /* node.mainComponent!.id === nodeOfComp.mainComponent!.id */

        const componentContext = getOrGenComponent(moduleContext, node, parentNode, false, isOriginalInstance);

        const nodeOfComp2 = !isOriginalInstance
          ? node
          : node.foundIntermediateSwap
          ? (context.intermediateNodes[context.intermediateNodes.length - 1] as InstanceNode2)
          : nodeOfComp;
        assertInstance(nodeOfComp2);

        const instanceNode = node;
        const instanceContext: InstanceContext = {
          ...context,
          componentContext,
          nodeOfComp: componentContext.node,
          intermediateInstanceNodeOfComps: [...context.intermediateInstanceNodeOfComps, nodeOfComp2],
          intermediateComponentContexts: [...context.intermediateComponentContexts, componentContext],
          intermediateNodes: [...context.intermediateNodes, componentContext.node],
          instanceNode,
          instanceNodeOfComp: nodeOfComp2,
          isRootInComponent: true,
        };

        // First, we check the sub-instance for overrides.
        genInstanceOverrides(instanceContext, node);

        // Here, overriden nodes have been listed in the compContext by genInstanceOverrides() above.

        if (!isOriginalInstance) {
          const compContext = getOrCreateCompContext(node);
          // If swapped, the new component is referenced, with overrides applied in props.
          // When getting this new component context, it was added to the list of components in the app. Its source code will be generated separately.
          const compAst = createComponentUsageWithAttributes(compContext, componentContext, node);

          addSwapInstance(context, node, compAst);
        }

        return;
      }
    }

    if (!isValidNode(node) && !isGroup(node)) {
      warnNode(node, 'TODO Unsupported instance node');
      return;
    }

    const parentIsAutoLayout = isFlexNode(parentNode) && parentNode.layoutMode !== 'NONE';

    // Cf notes in 4-gen-node.ts
    if (isGroup(node) && (!parentIsAutoLayout || isGroup(parentNode))) {
      recurseOnChildren(context, node, styles, true);
      return;
    }

    // Add common styles (text and tags)
    mapCommonStyles(context, node, styles);

    if (isText(node)) {
      addTextOverride(context, node, styles);
    } else if (isVector(node)) {
      return addNodeStyles(context, node, nodeOfComp, styles);
    } else if (isBlockNode(node)) {
      // Add tag styles
      mapTagStyles(context, node, styles);

      // the CSS rule is created before checking the children so that it appears first in the CSS file.
      // After generating the children, we can add the final list of rules or remove it if no rule.
      const cssRule = addCssRule(context, '_tmp');

      if (isChildrenMixin(node)) {
        recurseOnChildren(context, node, styles);
      }

      styles = postMapStyles(context, node, styles);
      const styleDeclarations = stylesToList(styles);
      if (styleDeclarations.length) {
        const className = getOrGenClassName(moduleContext, node);
        getOrGenClassName(componentContext, nodeOfComp);
        updateCssRuleClassName(context, cssRule, className);
        cssRule.block.children.push(...styleDeclarations);
        addStyleOverride(context, node);
      } else {
        removeCssRule(context, cssRule, node);
      }
    }
  } catch (error) {
    warnNode(node, 'Failed to generate instance override for component node with error below. Skipping the node.');
    if (!env.isProd) {
      throw error;
    }
    // Production: don't block the process
    handleError(error);
    return;
  }
}

function addNodeStyles(
  context: InstanceContext,
  node: ValidNode,
  nodeOfComp: SceneNode2,
  styles: Dict<DeclarationPlain>,
) {
  const { moduleContext, componentContext } = context;
  mapTagStyles(context, node, styles);
  styles = postMapStyles(context, node, styles);
  const styleDeclarations = stylesToList(styles);
  if (styleDeclarations.length) {
    const className = getOrGenClassName(moduleContext, node);
    getOrGenClassName(componentContext, nodeOfComp);
    addCssRule(context, className, styleDeclarations);
    addStyleOverride(context, node);
  }
}

function recurseOnChildren(
  context: InstanceContext,
  node: SceneNode2 & ChildrenMixin2,
  styles: Dict<DeclarationPlain>,
  passParentToChildContext?: boolean,
) {
  let masker: Masker | undefined = undefined;
  for (const child of node.children) {
    if (isBlendMixin(child) && child.isMask) {
      child.skip = true;
      masker = undefined; // In case we ignore the mask because of an error, don't mask target elements (vs wrong mask)
      if (!isVector(child)) {
        warnNode(child, 'BUG Mask is not a vector, which is unexpected and unsupported. Ignoring the mask node.');
        continue;
      }
      let svgContent = readSvg(child);
      if (!svgContent) {
        warnNode(child, 'BUG Mask SVG has no content, skipping.');
        continue;
      }
      const extension = 'svg';
      const assetCssUrl = writeAsset(context, node, extension, svgContent);

      masker = {
        width: child.width,
        height: child.height,
        // TODO Instead of Figma raw x/y, we may need to use the calculated top/left from flex.ts.
        // Test with borders, padding, scale mode for left in %...
        x: child.x,
        y: child.y,
        url: assetCssUrl,
      };
    } else if (isFrame(child) && child.clipsContent) {
      // frames reset the masking. The frame and next elements are not masked.
      masker = undefined;
    } else if (masker) {
      // Extend the node interface to add the mask info to process it with other properties
      child.maskedBy = masker;
    }
  }
  // Rare case: masks change on the instance, e.g. because a frame clipsContent changes
  // (if no clipsContent, it doesn't ends the list of masked nodes).
  // For that case, we would need to recalculate maskedBy.
  // Later...

  const {
    parentNode,
    parentStyles,
    parentContext,
    moduleContext,
    instanceNode,
    instanceNodeOfComp,
    nodeOfComp,
    componentContext,
    intermediateInstanceNodeOfComps,
    intermediateComponentContexts,
    intermediateNodes,
  } = context;
  if (!isChildrenMixin(nodeOfComp)) {
    warnNode(node, 'BUG Instance node has children, but the corresponding component node does not.');
    throw new Error('BUG Instance node has children, but the corresponding component node does not.');
  }

  const [instanceToCompIndexMap, hiddenNodes] = instanceToCompIndexRemapper(node, nodeOfComp);
  if (!instanceToCompIndexMap) {
    warnNode(node, 'BUG instanceToCompIndexMap falsy, although nodeOfComp is a ChildrenMixin.');
    throw new Error('BUG instanceToCompIndexMap falsy, although nodeOfComp is a ChildrenMixin.');
  }
  const nextCompNode = intermediateNodes[1];
  if (!nextCompNode) {
    throw new Error(`BUG [recurseOnChildren] nextNode is undefined.`);
  }
  assertChildrenMixin(nextCompNode);
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.skip) {
      continue;
    }
    const nextCompChildNode = nextCompNode.children[instanceToCompIndexMap[i]];
    const isOriginalInstance = checkIsOriginalInstance(child, nextCompChildNode);
    let childIntermediateNodes: (SceneNode2 | undefined)[];
    let childIntermediateInstanceNodeOfComps = intermediateInstanceNodeOfComps;
    let childIntermediateComponentContexts = intermediateComponentContexts;
    let swapContext: SwapContext | undefined = undefined;
    if (!isOriginalInstance) {
      // nextCompChildNode is the swapped node, will be used in addSwapInstance to generate the right props and usages.
      child.swapOfNode = nextCompChildNode as InstanceNode2; // checkIsOriginalInstance guarantees it's an instance
      childIntermediateNodes = [child];
      childIntermediateInstanceNodeOfComps = [];
      childIntermediateComponentContexts = [intermediateComponentContexts[0]];
      swapContext = {
        intermediateNodes: mapToChildrenAtPosition(intermediateNodes.slice(1), i),
        intermediateInstanceNodeOfComps: intermediateInstanceNodeOfComps,
        intermediateComponentContexts: intermediateComponentContexts.slice(1),
      };
    } else {
      // Replace intermediate nodes with the child at the same location:
      childIntermediateNodes = mapToChildrenAtPosition(intermediateNodes, i);
      // If the node is a swap in an intermediate component, we need to adjust the intermediate nodes and related data, so that style override props are passed to the swap instance directly, not going through the node receiving the swap.
      let foundSwap = -1;
      for (let i = 1; i < childIntermediateNodes.length; i++) {
        const prevIntermediateNode = childIntermediateNodes[i - 1];
        if (!prevIntermediateNode) {
          throw new Error(`BUG [recurseOnChildren] prevIntermediateNode is undefined.`);
        }

        const nextIntermediateNode = childIntermediateNodes[i];
        if (!nextIntermediateNode) {
          throw new Error(`BUG [recurseOnChildren] nextIntermediateNode is undefined.`);
        }

        const isOriginalInstance = checkIsOriginalInstance(prevIntermediateNode, nextIntermediateNode);
        if (!isOriginalInstance) {
          foundSwap = i;
          break;
        }
      }
      if (foundSwap !== -1) {
        childIntermediateNodes = childIntermediateNodes.slice(0, foundSwap);
        childIntermediateInstanceNodeOfComps = childIntermediateInstanceNodeOfComps.slice(0, foundSwap - 1);
        childIntermediateComponentContexts = childIntermediateComponentContexts.slice(0, foundSwap);
        child.foundIntermediateSwap = true;
      }
    }

    const childNodeOfComp = nodeOfComp.children[instanceToCompIndexMap[i]];
    const contextForChild: InstanceContext = {
      moduleContext,
      tagName: 'div', // Default value, will be overridden. To avoid undefined in typing.
      nodeNameLower: child.name.toLowerCase(),
      parentNode: passParentToChildContext ? parentNode : (node as FlexNode | GroupNode2),
      parentStyles: passParentToChildContext ? parentStyles : mergeWithInheritedStyles(context, styles),
      parentContext: passParentToChildContext ? parentContext : context,
      componentContext,
      instanceNode,
      instanceNodeOfComp,
      nodeOfComp: childNodeOfComp,
      intermediateInstanceNodeOfComps: childIntermediateInstanceNodeOfComps,
      intermediateComponentContexts: childIntermediateComponentContexts,
      intermediateNodes: childIntermediateNodes,
      isRootInComponent: false,
      swapContext,
    };
    genInstanceOverrides(contextForChild, child);
  }
}

function mapToChildrenAtPosition(intermediateNodes: InstanceContext['intermediateNodes'], position: number) {
  return intermediateNodes.map(intermediateNode => {
    // intermediateNode is undefined if an instance was swapped with another.
    if (!isChildrenMixin(intermediateNode)) {
      // warnNode(node, 'BUG Instance node has children, but the corresponding component node does not.');
      throw new Error('BUG Instance node has children, but the corresponding component node does not.');
    }
    const childIntermediateNode = intermediateNode.children[position /* instanceToCompIndexMap[position] */];
    return childIntermediateNode;
  });
}

function addStyleOverride(context: InstanceContext, node: SceneNode2) {
  const { nodeOfComp, intermediateNodes, intermediateComponentContexts, intermediateInstanceNodeOfComps } = context;

  // intermediateNodes[0] === node
  const overrideValue = intermediateNodes[0]?.className;

  if (!overrideValue) {
    warnOrThrow(
      `Applying addClassOverride on node ${node.name}, but overrideValue from intermediateNode ${intermediateNodes[0]?.name} is undefined.`,
    );
    return;
  }

  // Mark the component tag so that the className also gets a value from props (code to generate later).
  nodeOfComp.classOverride = true;

  addOverrides(
    intermediateNodes,
    intermediateComponentContexts,
    intermediateInstanceNodeOfComps,
    overrideValue,
    (componentContext, intermediateNode) => {
      // generate prop name
      const propName = getOrGenClassName(componentContext, intermediateNode); // intermediateNode.className

      // Add the component prop to the interface
      componentContext.classOverrides.add(propName);
      return propName;
    },
    'instanceStyleOverrides',
    'className',
  );
}

// TODO texte pas tjrs bien caché
function addSwapInstance(context: InstanceContext, node: SceneNode2, swapAst: SwapAst) {
  let { intermediateNodes, intermediateComponentContexts, intermediateInstanceNodeOfComps, swapContext } = context;
  if (!swapContext) {
    throw new Error(`BUG [addSwapInstance] swapContext is undefined. But it should be defined in recurseOnChildren.`);
  }

  // Mark the component tag so that a potential swap from prop is possible on this node (code to generate later).
  intermediateNodes = [...intermediateNodes, ...swapContext.intermediateNodes];
  intermediateComponentContexts = [...intermediateComponentContexts, ...swapContext.intermediateComponentContexts];
  intermediateInstanceNodeOfComps = [
    ...intermediateInstanceNodeOfComps,
    ...swapContext.intermediateInstanceNodeOfComps,
  ];

  const overrideValue = swapAst;

  addOverrides(
    intermediateNodes,
    intermediateComponentContexts,
    intermediateInstanceNodeOfComps,
    overrideValue,
    (componentContext, intermediateNode) => getOrGenSwapName(componentContext, intermediateNode),
    'instanceSwaps',
    'swapName',
  );
}

function addHideOverride(context: InstanceContext, node: SceneNode2) {
  let { intermediateNodes, intermediateComponentContexts, intermediateInstanceNodeOfComps } = context;
  const lastIntermediateNode = intermediateNodes[intermediateNodes.length - 1];

  if (lastIntermediateNode?.isRootInComponent) {
    intermediateNodes = intermediateNodes.slice(0, -1);
  }

  // Check that the visibility of current node changed vs the next intermediate component
  if (!(intermediateNodes.length >= 2) || intermediateNodes[0]?.visible === intermediateNodes[1]?.visible) {
    return;
  }

  const overrideValue = !node.visible;
  if (!lastIntermediateNode) {
    throw new Error(`BUG Last entry of intermediateNodes is undefined.`);
  }
  lastIntermediateNode.hideOverrideValue = overrideValue;

  addOverrides(
    intermediateNodes,
    intermediateComponentContexts,
    intermediateInstanceNodeOfComps,
    overrideValue,
    (componentContext, intermediateNode) => getOrGenHideProp(componentContext, intermediateNode),
    'instanceHidings',
    'hideProp',
  );
}

function addTextOverride(context: InstanceContext, node: TextNode2, styles: Dict<DeclarationPlain>) {
  let { intermediateNodes, intermediateComponentContexts, intermediateInstanceNodeOfComps } = context;

  // Check that the text of current node changed vs the next intermediate component
  const nextCompNode = intermediateNodes[1];
  if (!isText(nextCompNode)) {
    throw new Error(`BUG? Instance node ${node.name} is text but component node ${nextCompNode?.name} is not.`);
  }
  if (equal(node._textSegments, nextCompNode._textSegments)) {
    return;
  }
  prepareStylesOnTextSegments(context, node, styles);
  const textAst = genTextAst(node);
  if (!textAst) {
    return;
  }

  const overrideValue = textAst;

  addOverrides(
    intermediateNodes,
    intermediateComponentContexts,
    intermediateInstanceNodeOfComps,
    overrideValue,
    (componentContext, intermediateNode) => getOrGenTextOverrideProp(componentContext, intermediateNode),
    'instanceTextOverrides',
    'textOverrideProp',
  );
}

function addOverrides(
  intermediateNodes: InstanceContext['intermediateNodes'],
  intermediateComponentContexts: InstanceContext['intermediateComponentContexts'],
  intermediateInstanceNodeOfComps: InstanceContext['intermediateInstanceNodeOfComps'],
  overrideValue: SwapAst | string | boolean | JsxOneOrMore,
  genAndRegisterPropName: (componentContext: ModuleContext, intermediateNode: SceneNode2) => string,
  compContextField: 'instanceStyleOverrides' | 'instanceSwaps' | 'instanceHidings' | 'instanceTextOverrides',
  nodeFieldForOverrideValue: 'className' | 'swapName' | 'hideProp' | 'textOverrideProp',
) {
  for (let i = 1; i < intermediateNodes.length; i++) {
    const intermediateNode = intermediateNodes[i];
    if (!intermediateNode) {
      throw new Error(`BUG [addOverrides1] intermediateNode is nil`);
    }
    const componentContext = intermediateComponentContexts[i];

    // generate prop name + add to the interface
    const propName = genAndRegisterPropName(componentContext, intermediateNode);

    const indexByNode = intermediateNode;
    const indexBy = env.isDev && flags.indexOverrideByNodeId ? indexByNode.id : propName;

    // Update the parent instance to pass the override as prop to the instance.
    // A couple of sanity checks are done to help capturing bugs when developing.
    let parentInstanceNode = intermediateInstanceNodeOfComps[i - 1];
    const { [compContextField]: overrideField } = getOrCreateCompContext(parentInstanceNode);

    if (overrideField[indexBy] && overrideField[indexBy].propName !== propName) {
      warnOrThrow(
        `BUG [addOverrides2] Trying to assign a different propName on node ${indexByNode.name}. Existing propName: ${overrideField[indexBy].propName}, new one: ${propName}`,
      );
    }

    if (!overrideField[indexBy]) {
      overrideField[indexBy] = {
        intermediateNode,
        propName,
      };
    }
    const overrideEntry = overrideField[indexBy];
    if (i === 1) {
      if (overrideEntry.overrideValue != null && overrideEntry.overrideValue !== overrideValue) {
        warnOrThrow(
          `BUG [addOverrides3] The instance ${
            parentInstanceNode.name
          } already has an overrideValue set to override the node ${
            indexByNode.name
          }, but the value is different. Existing value: ${overrideEntry.overrideValue}, new value: ${
            typeof overrideValue === 'string' || typeof overrideValue === 'boolean'
              ? overrideValue
              : printStandalone(overrideValue)
          }`,
        );
      }
      overrideEntry.overrideValue = overrideValue;
    } else {
      let parentOverrideValue = intermediateNodes[i - 1]?.[nodeFieldForOverrideValue];
      if (parentOverrideValue == null) {
        warnOrThrow(
          `BUG [addOverrides4] The instance ${intermediateNodes[i - 1]?.name} has no overrideValue (${overrideValue}).`,
        );
      }
      if (overrideEntry.propValue && overrideEntry.propValue !== parentOverrideValue) {
        warnOrThrow(
          `BUG [addOverrides5] The instance ${parentInstanceNode.name} already has a propValue set to override the node ${indexByNode.name}, but the value is different. Existing value: ${overrideEntry.propValue}, new value: ${parentOverrideValue}`,
        );
      }
      overrideEntry.propValue = parentOverrideValue;
    }
  }
}
