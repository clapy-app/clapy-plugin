import { DeclarationPlain } from 'css-tree';

import { env } from '../../env-and-config/env';
import { handleError } from '../../utils';
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
  getOrCreateCompContext,
  getOrGenClassName,
  getOrGenHideProp,
  getOrGenSwapName,
  mkClassAttr,
  mkClassesAttribute,
  mkComponentUsage,
  removeCssRule,
} from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';

export function genInstanceOverrides(context: InstanceContext, node: SceneNode2) {
  try {
    const { parentNode, moduleContext, componentContext, nodeOfComp } = context;

    let styles: Dict<DeclarationPlain> = {};

    if (!node.visible && context.isRootInComponent) {
      // It happens, we stop here. We may just need to ensure the instance node has a hideProp true on it.
      return;
    }
    addHideNode(context, node, context.nodeOfComp);
    if (!node.visible) {
      return;
    }

    const isRootNode = componentContext.node === nodeOfComp;
    // There can't be a component inside a component (Figma makes it impossible),
    // Nor a component inside an instance.
    // const isComp = isComponent(node);
    const isInst = isInstance(node);
    const compNodeIsInstance = isInstance(nodeOfComp);
    if (!isRootNode && isInst && !compNodeIsInstance) {
      throw new Error(
        'Instance in instance found, but the original parent component does not have an instance at the same location.',
      );
    }
    if (!isRootNode && isInst && compNodeIsInstance) {
      const isOriginalInstance = node.mainComponent!.id === nodeOfComp.mainComponent!.id;
      // If not original instance, it has been swapped. See special processing below.

      const componentContext = getOrGenComponent(moduleContext, node, parentNode, false, isOriginalInstance);

      // Get the styles/swaps for all instance overrides. Styles and swaps only, for all nodes. No need to generate any AST.
      const instanceContext: InstanceContext = {
        ...context,
        componentContext,
        nodeOfComp: componentContext.node,
        instanceNode: node,
        isRootInComponent: true,
      };

      genInstanceOverrides(instanceContext, node);

      const compContext = getOrCreateCompContext(node /* nodeOfComp */);
      const { instanceClassesForStyles, instanceSwaps, instanceHidings } = compContext;

      if (isOriginalInstance) {
        const compContext = getOrCreateCompContext(nodeOfComp);
        // TODO trouver un autre moyen que mappingDone, car en passant sur une 2è isntance, on pourrait avoir d'autres instanceHidings à mapper, mais aussi les mêmes à sauter.
        if (!compContext.mappingDone) {
          compContext.mappingDone = true;
          mapClassesToParentInstanceProp(context, instanceClassesForStyles);
        }
        mapSwapToParentInstanceProp(context, instanceSwaps);
        mapHideToParentInstanceProp(context, instanceHidings);

        addSwapInstance(context, false);
      } else {
        //-------------------------------------------------
        // TODO some attribute to add for hiding in swapped instance?
        //-------------------------------------------------

        const { root, ...otherInstanceClasses } = instanceClassesForStyles;

        // Adding className overrides from props is probably required in a use case (with swaps?), but the use case is not clear yet. To enable once we have an example where we need it, to better understand if we are not adding a wrong or empty value.
        const classAttr = mkClassAttr(root, true);
        const classesAttr = mkClassesAttribute(otherInstanceClasses);
        const attrs = classesAttr ? [classAttr, classesAttr] : [classAttr];

        let compAst: SwapAst = mkComponentUsage(componentContext.compName, attrs);

        addSwapInstance(context, compAst);
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
        const className = getOrGenClassName(moduleContext, node, undefined, context);
        const styleDeclarations = stylesToList(styles);
        if (styleDeclarations.length) {
          addCssRule(context, className, styleDeclarations);
          addClassOverride(context, className);
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
      return addNodeStyles(context, node, styles);
    } else if (isBlockNode(node)) {
      // Add tag styles
      mapTagStyles(context, node, styles);

      const className = getOrGenClassName(moduleContext, node, undefined, context);

      // the CSS rule is created before checking the children so that it appears first in the CSS file.
      // After generating the children, we can add the final list of rules or remove it if no rule.
      const cssRule = addCssRule(context, className);

      if (isChildrenMixin(node)) {
        recurseOnChildren(context, node, styles);
      }

      styles = postMapStyles(context, node, styles);
      const styleDeclarations = stylesToList(styles);
      if (styleDeclarations.length) {
        cssRule.block.children.push(...styleDeclarations);
      } else {
        removeCssRule(context, cssRule, node);
      }

      addClassOverride(context, className);
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

  const { parentNode, parentStyles, parentContext, moduleContext, instanceNode, nodeOfComp, componentContext } =
    context;
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
    const contextForChild: InstanceContext = {
      moduleContext,
      tagName: 'div', // Default value, will be overridden. To avoid undefined in typing.
      nodeNameLower: child.name.toLowerCase(),
      parentNode: passParentToChildContext ? parentNode : (node as FlexNode | GroupNode2),
      parentStyles: passParentToChildContext ? parentStyles : styles,
      parentContext: passParentToChildContext ? parentContext : context,
      componentContext,
      instanceNode,
      nodeOfComp: childNodeOfComp,
      isRootInComponent: false,
    };
    genInstanceOverrides(contextForChild, child);
  }
}

function addNodeStyles(context: InstanceContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const { moduleContext } = context;
  mapTagStyles(context, node, styles);
  const className = getOrGenClassName(moduleContext, node, undefined, context);
  styles = postMapStyles(context, node, styles);
  const styleDeclarations = stylesToList(styles);
  if (styleDeclarations.length) {
    addCssRule(context, className, styleDeclarations);
    addClassOverride(context, className);
  }
}

function addClassOverride(context: InstanceContext, className: string) {
  const { instanceNode, nodeOfComp, componentContext } = context;
  const { instanceClassesForStyles } = getOrCreateCompContext(instanceNode);
  const compClassName = getOrGenClassName(componentContext, nodeOfComp);
  if (!compClassName) {
    throw new Error(`Component node ${nodeOfComp.name} has no className`);
  }
  if (!className) {
    throw new Error(
      `Component node ${nodeOfComp.name}: trying to set a nil className for overrides for classes ${compClassName}`,
    );
  }
  if (instanceClassesForStyles[compClassName] && instanceClassesForStyles[compClassName] !== className) {
    throw new Error(
      `Component node ${nodeOfComp.name}: trying to set classes ${compClassName} with value ${className}, but this classes entry is already set and different from the class name we wanted to assign.`,
    );
  }
  instanceClassesForStyles[compClassName] = className;
}

/**
 * Ensure the sub-instance we met apply swaps on the selected nodes (previous instance check) => sub-instance context
 * AND that the parent instance exposes those swap capabilities => parent instance context
 */
function mapClassesToParentInstanceProp(
  parentContext: InstanceContext,
  childCompInstanceClasses: CompContext['instanceClassesForStyles'],
) {
  if (childCompInstanceClasses) {
    for (const [classOverrideName, finalClassName] of Object.entries(childCompInstanceClasses)) {
      const { instanceNode, componentContext, nodeOfComp } = parentContext;
      const classPropName = getOrGenClassName(componentContext, undefined, classOverrideName);

      // In this component, link parent hide prop to child hide prop
      // = add `hide={{[hideBaseName]: props.hide?.[hideName]}}` on the instance
      const { instanceClassesForStyles: currentCompInstanceClasses } = getOrCreateCompContext(nodeOfComp);
      if (currentCompInstanceClasses[classOverrideName]) {
        throw new Error(
          `[map1] Component node ${nodeOfComp.name}: trying to map classes ${classOverrideName} with value ${classPropName}, but this classes entry is already mapped or set`,
        );
      }
      currentCompInstanceClasses[classOverrideName] = classPropName;

      // Tell the parent that the grandchild has something to hide for this instance
      const { instanceClassesForStyles: parentCompInstanceClasses } = getOrCreateCompContext(instanceNode);
      if (parentCompInstanceClasses[classPropName]) {
        throw new Error(
          `[map2] Component node ${instanceNode.name}: trying to map classes ${classPropName} with value ${finalClassName}, but this classes entry is already mapped or set`,
        );
      }
      parentCompInstanceClasses[classPropName] = finalClassName;
    }
  }
}

function addSwapInstance(context: InstanceContext, swapAst: SwapAst | false) {
  const { instanceNode, nodeOfComp, componentContext } = context;
  const { instanceSwaps } = getOrCreateCompContext(instanceNode);
  const swapName = getOrGenSwapName(componentContext, nodeOfComp);
  if (!swapName) {
    throw new Error(`Component node ${nodeOfComp.name} has no swapName`);
  }
  if (swapAst == null) {
    throw new Error(
      `Component node ${nodeOfComp.name}: trying to set a nil swapAst for overrides for swap ${swapName}`,
    );
  }
  if (typeof instanceSwaps[swapName] !== 'string') {
    if (instanceSwaps[swapName]) {
      throw new Error(
        `Component node ${nodeOfComp.name}: trying to set swap ${swapName} with value ${
          swapAst === false ? swapAst : printStandalone(swapAst)
        }, but this swap entry is already set`,
      );
    }
    instanceSwaps[swapName] = swapAst;
  }
  if (swapAst && instanceNode.mapSwapsToProps) {
    instanceNode.mapSwapsToProps();
  }
}

/**
 * Ensure the sub-instance we met apply swaps on the selected nodes (previous instance check) => sub-instance context
 * AND that the parent instance exposes those swap capabilities => parent instance context
 */
function mapSwapToParentInstanceProp(
  parentContext: InstanceContext,
  childCompInstanceSwaps: CompContext['instanceSwaps'],
) {
  if (childCompInstanceSwaps) {
    for (const [swapBaseName, ast] of Object.entries(childCompInstanceSwaps)) {
      const { instanceNode, componentContext, nodeOfComp } = parentContext;

      nodeOfComp.mapSwapsToProps = () => {
        if (nodeOfComp.swapsMapped) {
          return;
        }
        nodeOfComp.swapsMapped = true;

        const swapName = getOrGenSwapName(componentContext, undefined, swapBaseName);

        const { instanceSwaps: currentCompInstanceSwaps } = getOrCreateCompContext(nodeOfComp);
        currentCompInstanceSwaps[swapBaseName] = swapName;

        const { instanceSwaps: parentCompInstanceSwaps } = getOrCreateCompContext(instanceNode);
        parentCompInstanceSwaps[swapName] = ast;
      };
      if (ast) {
        nodeOfComp.mapSwapsToProps();
      }
    }
  }
}

function addHideNode(context: InstanceContext, node: SceneNode2, nodeOfComp: SceneNode2) {
  const { instanceNode, componentContext } = context;
  const { instanceHidings } = getOrCreateCompContext(instanceNode);
  const hideName = getOrGenHideProp(componentContext, nodeOfComp);
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
        if (nodeOfComp.hidesMapped) {
          return;
        }
        nodeOfComp.hidesMapped = true;

        const hideName = getOrGenHideProp(componentContext, undefined, hideBaseName);

        // In this component, link parent hide prop to child hide prop
        // = add `hide={{[hideBaseName]: props.hide?.[hideName]}}` on the instance
        const { instanceHidings: currentCompInstanceHidings } = getOrCreateCompContext(nodeOfComp);
        currentCompInstanceHidings[hideBaseName] = hideName;

        // Tell the parent that the grandchild has something to hide for this instance
        const { instanceHidings: parentCompInstanceHidings } = getOrCreateCompContext(instanceNode);
        parentCompInstanceHidings[hideName] = hideValue;
      };
      if (hideValue) {
        nodeOfComp.mapHidesToProps();
      }
    }
  }
}
