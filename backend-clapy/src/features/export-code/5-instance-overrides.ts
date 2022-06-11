import { DeclarationPlain } from 'css-tree';
import equal from 'fast-deep-equal';

import { flags } from '../../env-and-config/app-config';
import { env } from '../../env-and-config/env';
import { handleError, warnOrThrow } from '../../utils';
import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { getOrGenComponent } from './3-gen-component';
import { mapCommonStyles, mapTagStyles, mapTextStyles, postMapStyles } from './6-figma-to-code-map';
import { CompContext, InstanceContext, JsxOneOrMore, SwapAst } from './code.model';
import { writeAsset } from './create-ts-compiler/2-write-asset';
import {
  ChildrenMixin2,
  FlexNode,
  GroupNode2,
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
  ValidNode,
} from './create-ts-compiler/canvas-utils';
import { printStandalone } from './create-ts-compiler/parsing.utils';
import { stylesToList } from './css-gen/css-type-utils';
import { instanceToCompIndexRemapper } from './figma-code-map/details/default-node';
import { readSvg } from './figma-code-map/details/process-nodes-utils';
import {
  addCssRule,
  createComponentUsageWithAttributes,
  createTextAst,
  getOrCreateCompContext,
  getOrGenClassName,
  getOrGenHideProp,
  getOrGenSwapName,
  getOrGenTextOverrideProp,
  removeCssRule,
  updateCssRuleClassName,
} from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';

export function genInstanceOverrides(context: InstanceContext, node: SceneNode2) {
  try {
    const { parentNode, moduleContext, componentContext, nodeOfComp, isRootInComponent } = context;
    node.nodeOfComp = nodeOfComp;

    let styles: Dict<DeclarationPlain> = {};

    if (!node.visible && context.isRootInComponent) {
      // It happens, we stop here. We may just need to ensure the instance node has a hideProp true on it.
      return;
    }
    addHideNode(context, node);
    if (!node.visible) {
      return;
    }

    // There can't be a component inside a component (Figma makes it impossible),
    // Nor a component inside an instance.
    // const isComp = isComponent(node);
    const isInst = isInstance(node);
    const compNodeIsInstance = isInstance(nodeOfComp);
    if (!isRootInComponent && isInst && !compNodeIsInstance) {
      throw new Error(
        'Instance in instance found, but the original parent component does not have an instance at the same location.',
      );
    }
    if (!isRootInComponent && isInst && compNodeIsInstance) {
      // We found a sub-instance. The current instance is an intermediate layer. The sub-instance potentially also has overrides we need to find and bind to the top-level instance and pass props through all layers.

      const isOriginalInstance = node.mainComponent!.id === nodeOfComp.mainComponent!.id; // = not swapped in Figma

      const componentContext = getOrGenComponent(moduleContext, node, parentNode, false, isOriginalInstance);

      const instanceNode = node;
      const instanceContext: InstanceContext = {
        ...context,
        componentContext,
        nodeOfComp: componentContext.node,
        intermediateInstanceNodeOfComps: [...context.intermediateInstanceNodeOfComps, nodeOfComp],
        intermediateComponentContexts: [...context.intermediateComponentContexts, componentContext],
        intermediateNodes: [...context.intermediateNodes, isOriginalInstance ? componentContext.node : undefined],
        instanceNode,
        instanceNodeOfComp: nodeOfComp,
        isRootInComponent: true,
      };

      // First, we check the sub-instance for overrides.
      genInstanceOverrides(instanceContext, node);

      // Here, overriden nodes have been listed in the compContext by genInstanceOverrides() above.
      const compContext = getOrCreateCompContext(nodeOfComp);

      if (isOriginalInstance) {
        // Old comment, to remove once all map* functions have been removed.
        // the functions adding overrides take care of this part. They should be commented well.
        // ------
        // If no swap, we add all overrides to the sub-instance props, and we map the value to the current instance's comp own props. E.g.:
        // const Comp: FC<{ hide: { subCompIcon?: boolean } }> = props => {
        //   return <SubComp hide={{icon: props.hide.subCompIcon}} />
        // }
        // And in the parent component:
        // ... <Comp hide={{ subCompIcon: true }} />
        const { instanceSwaps, instanceHidings, instanceTextOverrides } = compContext;
        mapHideToParentInstanceProp(context, instanceHidings);
        mapTextOverrideToParentInstanceProp(context, instanceTextOverrides);
      } else {
        // If swapped, the new component is referenced, with overrides applied in props.
        // When getting this new component context, it was added to the list of components in the app. Its source code will be generated separately.
        const compAst = createComponentUsageWithAttributes(compContext, componentContext, node);

        addSwapInstance(context, node, compAst);
      }

      return;
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
      if (!isText(nodeOfComp)) {
        throw new Error(`BUG? Instance node ${node.name} is text but component node ${nodeOfComp.name} is not.`);
      }
      if (!equal(node._textSegments, nodeOfComp._textSegments)) {
        const ast = createTextAst(context, node, styles);
        if (ast) {
          addTextOverride(context, node, ast);
        }
      }
      // Add text styles
      let ast: JsxOneOrMore | undefined = mapTextStyles(context, node, styles);
      if (!ast) {
        warnNode(node, 'No text segments found in node. Cannot generate the HTML tag.');
        return;
      }

      const flexStyles: Dict<DeclarationPlain> = {};
      mapTagStyles(context, node, flexStyles);

      if (!context.parentStyles || Object.keys(flexStyles).length) {
        Object.assign(styles, flexStyles);
        styles = postMapStyles(context, node, styles);
        const styleDeclarations = stylesToList(styles);
        if (styleDeclarations.length) {
          const className = getOrGenClassName(moduleContext, node);
          getOrGenClassName(componentContext, nodeOfComp);
          addCssRule(context, className, styleDeclarations);
          addClassOverride(context, node);
        }
      } else {
        styles = postMapStyles(context, node, styles);
        Object.assign(context.parentStyles, styles);
      }
      //
      // return ast;
      // TODO something with the ast, likely add as attribute of the instance (render prop)
      //
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
        addClassOverride(context, node);
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
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.skip) {
      continue;
    }
    const childNodeOfComp = nodeOfComp.children[instanceToCompIndexMap[i]];
    // Replace intermediate nodes with the child at the same location:
    const childIntermediateNodes = intermediateNodes.map(intermediateNode => {
      // intermediateNode is undefined if an instance was swapped with another.
      if (!intermediateNode) return undefined;
      if (!isChildrenMixin(intermediateNode)) {
        warnNode(node, 'BUG Instance node has children, but the corresponding component node does not.');
        throw new Error('BUG Instance node has children, but the corresponding component node does not.');
      }
      if (!intermediateNode || node.isSwapped) {
        return undefined;
      }
      const childIntermediateNode = intermediateNode.children[instanceToCompIndexMap[i]];
      const childIsInstance = isInstance(child);
      const intermediateChildIsInstance = isInstance(childIntermediateNode);
      if (childIsInstance !== intermediateChildIsInstance) {
        warnNode(
          node,
          `BUG childIsInstance: ${childIsInstance} but intermediateChildIsInstance: ${intermediateChildIsInstance}, althought they are supposed to be the same.`,
        );
        throw new Error(
          `BUG childIsInstance: ${childIsInstance} but intermediateChildIsInstance: ${intermediateChildIsInstance}, althought they are supposed to be the same.`,
        );
      }
      if (childIsInstance && intermediateChildIsInstance) {
        const isOriginalInstance = child.mainComponent!.id === childIntermediateNode.mainComponent!.id; // = not swapped in Figma
        if (!isOriginalInstance) {
          child.isSwapped = true;
        }
      }
      return childIntermediateNode;
    });
    const contextForChild: InstanceContext = {
      moduleContext,
      tagName: 'div', // Default value, will be overridden. To avoid undefined in typing.
      nodeNameLower: child.name.toLowerCase(),
      parentNode: passParentToChildContext ? parentNode : (node as FlexNode | GroupNode2),
      parentStyles: passParentToChildContext ? parentStyles : styles,
      parentContext: passParentToChildContext ? parentContext : context,
      componentContext,
      instanceNode,
      instanceNodeOfComp,
      nodeOfComp: childNodeOfComp,
      intermediateInstanceNodeOfComps,
      intermediateComponentContexts,
      intermediateNodes: childIntermediateNodes,
      isRootInComponent: false,
    };
    genInstanceOverrides(contextForChild, child);
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
    addClassOverride(context, node);
  }
}

function addClassOverride(context: InstanceContext, node: SceneNode2) {
  const { nodeOfComp } = context;
  if (!node.className) {
    warnOrThrow(`Applying addClassOverride on node ${node.name}, but node.className is undefined.`);
    return;
  }
  if (!nodeOfComp.className) {
    warnOrThrow(`Applying addClassOverride on node ${node.name}, but nodeOfComp.className is undefined.`);
    return;
  }

  // context.intermediateNodes[0] === node
  const overrideValue = context.intermediateNodes[0]?.className;

  // Mark the component tag so that the className also gets a value from props (code to generate later).
  nodeOfComp.classOverride = true;

  // And nodes of the various intermediate components/instances are updated to pass the property from the top-level instance down to the most inner component, as class props overriding styles.
  for (let i = 1; i < context.intermediateNodes.length; i++) {
    const intermediateNode = context.intermediateNodes[i];
    if (!intermediateNode) {
      break;
    }
    const componentContext = context.intermediateComponentContexts[i];

    // generate prop name
    const propName = getOrGenClassName(componentContext, intermediateNode); // intermediateNode.className

    const indexByNode = intermediateNode;
    const indexBy = env.isDev && flags.indexOverrideByNodeId ? indexByNode.id : propName;

    // Add the component prop in the interface
    componentContext.classOverrides.add(propName);

    // Update the parent instance to pass the override as prop to the instance.
    // A couple of sanity checks are done to help capturing bugs when developing.
    let parentInstanceNode = context.intermediateInstanceNodeOfComps[i - 1];
    const { instanceStyleOverrides } = getOrCreateCompContext(parentInstanceNode);

    if (instanceStyleOverrides[indexBy] && instanceStyleOverrides[indexBy].propName !== propName) {
      warnOrThrow(
        `BUG [addClassOverride1] Trying to assign a different propName on node ${indexByNode.name}. Existing propName: ${instanceStyleOverrides[indexBy].propName}, new one: ${propName}`,
      );
    }

    if (!instanceStyleOverrides[indexBy]) {
      instanceStyleOverrides[indexBy] = {
        isRootNodeOverride: nodeOfComp.className === 'root',
        intermediateNode,
        propName,
      };
    }
    const styleOverride = instanceStyleOverrides[indexBy];
    if (i === 1) {
      if (!overrideValue) {
        warnOrThrow(
          `BUG [addClassOverride2] The instance ${context.intermediateNodes[0]?.name} has no overrideValue (${overrideValue}).`,
        );
      }
      if (styleOverride.overrideValue && styleOverride.overrideValue !== overrideValue) {
        warnOrThrow(
          `BUG [addClassOverride3] The instance ${parentInstanceNode.name} already has an overrideValue set to override the node ${indexByNode.name}, but the value is different. Existing value: ${styleOverride.overrideValue}, new value: ${overrideValue}`,
        );
      }
      styleOverride.overrideValue = overrideValue;
    } else {
      let parentOverrideValue = context.intermediateNodes[i - 1]?.className;
      if (!overrideValue) {
        warnOrThrow(
          `BUG [addClassOverride2] The instance ${
            context.intermediateNodes[i - 1]?.name
          } has no overrideValue (${overrideValue}).`,
        );
      }
      if (styleOverride.propValue && styleOverride.propValue !== parentOverrideValue) {
        warnOrThrow(
          `BUG [addClassOverride4] The instance ${parentInstanceNode.name} already has a propValue set to override the node ${indexByNode.name}, but the value is different. Existing value: ${styleOverride.propValue}, new value: ${parentOverrideValue}`,
        );
      }
      styleOverride.propValue = parentOverrideValue;
    }
  }
}

function addSwapInstance(context: InstanceContext, node: SceneNode2, swapAst: SwapAst) {
  const { instanceNode, nodeOfComp, componentContext } = context;
  // Mark the component tag so that a potential swap from prop is possible on this node (code to generate later).
  getOrGenSwapName(componentContext, nodeOfComp);

  const overrideValue = swapAst;

  // TODO required?
  // getOrGenSwapName(componentContext, node);

  // And nodes of the various intermediate components/instances are updated to pass the property from the top-level instance down to the most inner component, as swap props.
  for (let i = 1; i < context.intermediateNodes.length; i++) {
    const intermediateNode = context.intermediateNodes[i];
    if (!intermediateNode) {
      break;
    }
    const componentContext = context.intermediateComponentContexts[i];

    // generate prop name
    const propName = getOrGenSwapName(componentContext, intermediateNode);

    const indexByNode = intermediateNode;
    const indexBy = env.isDev && flags.indexOverrideByNodeId ? indexByNode.id : propName;

    // Add the component prop in the interface
    componentContext.swaps.add(propName);

    // Update the parent instance to pass the override as prop to the instance.
    // A couple of sanity checks are done to help capturing bugs when developing.
    let parentInstanceNode = context.intermediateInstanceNodeOfComps[i - 1];
    const { instanceSwaps } = getOrCreateCompContext(parentInstanceNode);

    if (instanceSwaps[indexBy] && instanceSwaps[indexBy].propName !== propName) {
      warnOrThrow(
        `BUG [addSwapInstance1] Trying to assign a different propName on node ${indexByNode.name}. Existing propName: ${instanceSwaps[indexBy].propName}, new one: ${propName}`,
      );
    }

    if (!instanceSwaps[indexBy]) {
      instanceSwaps[indexBy] = {
        isRootNodeOverride: false,
        intermediateNode,
        propName,
      };
    }
    const swapOverride = instanceSwaps[indexBy];
    if (i === 1) {
      if (swapOverride.overrideValue && swapOverride.overrideValue !== overrideValue) {
        warnOrThrow(
          `BUG [addSwapInstance2] The instance ${
            parentInstanceNode.name
          } already has an overrideValue set to override the node ${
            indexByNode.name
          }, but the value is different. Existing value: ${swapOverride.overrideValue}, new value: ${printStandalone(
            overrideValue,
          )}`,
        );
      }
      swapOverride.overrideValue = overrideValue;
    } else {
      let parentOverrideValue = context.intermediateNodes[i - 1]?.swapName;
      if (swapOverride.propValue && swapOverride.propValue !== parentOverrideValue) {
        warnOrThrow(
          `BUG [addSwapInstance3] The instance ${parentInstanceNode.name} already has a propValue set to override the node ${indexByNode.name}, but the value is different. Existing value: ${swapOverride.propValue}, new value: ${parentOverrideValue}`,
        );
      }
      swapOverride.propValue = parentOverrideValue;
    }
  }
}

function addHideNode(context: InstanceContext, node: SceneNode2) {
  const { instanceNode, componentContext, nodeOfComp } = context;
  const { instanceHidings } = getOrCreateCompContext(instanceNode);
  const hideName = getOrGenHideProp(componentContext, nodeOfComp, node.name, node.visible);
  if (!hideName) {
    throw new Error(`Component node ${nodeOfComp.name} has no hideName`);
  }
  if (!instanceHidings[hideName]) {
    instanceHidings[hideName] = !node.visible;
  }
  // See notes in mapHideToParentInstanceProp to understand what this function is.
  if (!node.visible && instanceNode.mapHidesToProps) {
    instanceNode.mapHidesToProps();
  }
}

/**
 * Ensure the sub-instance we met apply hiding on the selected nodes (previous instance check) => sub-instance context
 * AND that the parent instance exposes those hiding capabilities => parent instance context
 */
function mapHideToParentInstanceProp(
  parentContext: InstanceContext,
  childCompInstanceHidings: CompContext['instanceHidings'],
) {
  if (childCompInstanceHidings) {
    for (const [hideBaseName, hideValue] of Object.entries(childCompInstanceHidings)) {
      const { instanceNode, componentContext, nodeOfComp } = parentContext;

      // Special hack. When checking a sub-instance for hide overrides, we may find nothing to hide, because that instances shows the element.
      // But an intermediate component (which this sub-instance depends on) may hide it in Figma.
      // When addHideNode finds, later, that the intermediate component actually hides the element, it means we need to get back to the mapping here and bind "hide" to a prop, to ensure it will remain visible with the bigger component.
      // The function triggering the mapping, attached to the node, is dirty, but makes this retrospective possible.
      // The notion of default value is mising for now. It could be either hideValue or the value from addHideNode() when it calls mapHidesToProps().
      nodeOfComp.mapHidesToProps = () => {
        const { instanceHidings: currentCompInstanceHidings } = getOrCreateCompContext(nodeOfComp);
        let hideName: string;
        if (currentCompInstanceHidings[hideBaseName]) {
          if (typeof currentCompInstanceHidings[hideBaseName] !== 'string') {
            warnOrThrow(
              '[mapHideToParentInstanceProp] existing currentCompInstanceHidings[hideBaseName] is not a string',
            );
            return;
          }
          hideName = currentCompInstanceHidings[hideBaseName] as string;
        } else {
          hideName = getOrGenHideProp(componentContext, undefined, hideBaseName);
          currentCompInstanceHidings[hideBaseName] = hideName;
        }

        // Tell the parent that the grandchild has something to hide for this instance
        const { instanceHidings: parentCompInstanceHidings } = getOrCreateCompContext(instanceNode);
        if (!parentCompInstanceHidings[hideName]) {
          parentCompInstanceHidings[hideName] = hideValue;
        }
      };
      if (hideValue) {
        nodeOfComp.mapHidesToProps();
      }
    }
  }
}

function addTextOverride(context: InstanceContext, node: SceneNode2, text: JsxOneOrMore) {
  const { instanceNode, componentContext, nodeOfComp } = context;
  const { instanceTextOverrides } = getOrCreateCompContext(instanceNode);
  const textOverrideName = getOrGenTextOverrideProp(componentContext, nodeOfComp, node.name);
  if (!textOverrideName) {
    throw new Error(`Component node ${nodeOfComp.name} has no textOverrideName`);
  }
  if (text == null) {
    throw new Error(
      `Component node ${nodeOfComp.name}: trying to set a nil text for overrides for swap ${textOverrideName}`,
    );
  }
  if (!instanceTextOverrides[textOverrideName]) {
    instanceTextOverrides[textOverrideName] = text;
  }
  // See notes in mapHideToParentInstanceProp to understand what this function is.
  if (text && instanceNode.mapTextOverridesToProps) {
    instanceNode.mapTextOverridesToProps();
  }
}

/**
 * Ensure the sub-instance we met apply text override on the selected nodes (previous instance check) => sub-instance context
 * AND that the parent instance exposes those text override capabilities => parent instance context
 */
function mapTextOverrideToParentInstanceProp(
  parentContext: InstanceContext,
  childCompInstanceTextOverrides: CompContext['instanceTextOverrides'],
) {
  if (childCompInstanceTextOverrides) {
    for (const [textOverrideBaseName, textOverrideValue] of Object.entries(childCompInstanceTextOverrides)) {
      const { instanceNode, componentContext, nodeOfComp } = parentContext;

      nodeOfComp.mapTextOverridesToProps = () => {
        const { instanceTextOverrides: currentCompInstanceTextOverrides } = getOrCreateCompContext(nodeOfComp);
        let textOverrideName: string;
        if (currentCompInstanceTextOverrides[textOverrideBaseName]) {
          textOverrideName = currentCompInstanceTextOverrides[textOverrideBaseName] as string;
        } else {
          textOverrideName = getOrGenTextOverrideProp(componentContext, undefined, textOverrideBaseName);
          currentCompInstanceTextOverrides[textOverrideBaseName] = textOverrideName;
        }

        // Tell the parent that the grandchild has text to override for this instance
        const { instanceTextOverrides: parentCompInstanceTextOverrides } = getOrCreateCompContext(instanceNode);
        if (!parentCompInstanceTextOverrides[textOverrideName]) {
          parentCompInstanceTextOverrides[textOverrideName] = textOverrideValue;
        }
      };
      if (textOverrideValue) {
        nodeOfComp.mapTextOverridesToProps();
      }
    }
  }
}
