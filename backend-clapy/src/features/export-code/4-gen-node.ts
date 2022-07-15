import type { DeclarationPlain } from 'css-tree';
import type ts from 'typescript';

import { flags } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import { handleError } from '../../utils.js';
import type { Dict } from '../sb-serialize-preview/sb-serialize.model.js';
import { mapCommonStyles, mapTagStyles, postMapStyles } from './6-figma-to-code-map.js';
import type { NodeContext } from './code.model.js';
import { writeAsset } from './create-ts-compiler/2-write-asset.js';
import type {
  ChildrenMixin2,
  FlexNode,
  GroupNode2,
  InstanceNode2,
  Masker,
  SceneNode2,
  ValidNode,
} from './create-ts-compiler/canvas-utils.js';
import {
  isBlendMixin,
  isBlockNode,
  isChildrenMixin,
  isComponent,
  isFlexNode,
  isFrame,
  isGroup,
  isInstance,
  isText,
  isValidNode,
  isVector,
} from './create-ts-compiler/canvas-utils.js';
import { mergeWithInheritedStyles } from './css-gen/css-factories-high.js';
import { stylesToList } from './css-gen/css-type-utils.js';
import { addMuiImport, checkAndProcessMuiComponent, mkMuiComponentAst } from './frameworks/mui/mui-utils.js';
import { genCompUsage, prepareCompUsageWithOverrides } from './gen-node-utils/3-gen-comp-utils.js';
import { addNodeStyles, createSvgAst, readSvg, registerSvgForWrite } from './gen-node-utils/process-nodes-utils.js';
import { genTextAst, prepareStylesOnTextSegments } from './gen-node-utils/text-utils.js';
import {
  addCssRule,
  createClassAttrForNode,
  fillIsRootInComponent,
  getOrGenClassName,
  getOrGenHideProp,
  mkIdAttribute,
  mkSwapInstanceAndHideWrapper,
  mkTag,
  mkWrapHideAndTextOverrideAst,
  removeCssRule,
  updateCssRuleClassName,
} from './gen-node-utils/ts-ast-utils.js';
import { warnNode } from './gen-node-utils/utils-and-reset.js';
import { guessTagNameAndUpdateNode } from './smart-guesses/guessTagName.js';

export function prepareNode(context: NodeContext, node: SceneNode2) {
  try {
    node.nodeContext = context;
    node.styles = {};
    if (!node.visible && context.moduleContext.isRootComponent) {
      node.skip = true;
      return;
    }

    const { parentNode, moduleContext, isRootInComponent } = context;
    fillIsRootInComponent(moduleContext, node);
    if (isRootInComponent) {
      // Always generate the className prop for root nodes
      getOrGenClassName(moduleContext, node);
    }
    node.hideDefaultValue = !node.visible;
    if (!node.visible) {
      getOrGenHideProp(moduleContext, node);
    }

    let styles: Dict<DeclarationPlain> = {};

    let muiConfig = checkAndProcessMuiComponent(context, node);
    if (muiConfig) {
      context.outerLayoutOnly = true;
      const node2 = node as InstanceNode2;
      muiConfig = addMuiImport(moduleContext, muiConfig);

      // Add tag styles
      mapCommonStyles(context, node2, styles);
      styles = addNodeStyles1(context, node2, styles);
      node.styles = styles;
      node.muiConfig = muiConfig;
    }

    const isComp = isComponent(node);
    const isInst = isInstance(node);
    if (!isRootInComponent && (isComp || isInst)) {
      prepareCompUsageWithOverrides(context, node);
      return;
    }

    const [newNode, extraAttributes] = guessTagNameAndUpdateNode(context, node, styles);
    if (newNode) node = newNode;
    node.extraAttributes = extraAttributes;

    if (!isValidNode(node) && !isGroup(node)) {
      warnNode(node, 'TODO Unsupported node');
      node.skip = true;
      return;
    }
    const parentIsAutoLayout = isFlexNode(parentNode) && parentNode.layoutMode !== 'NONE';
    // With groups, there are 2 special cases:
    // - The parent is a frame, not auto-layout
    // - The parent is a group
    // In both cases, the child group has no impact in the layout. It is skipped and children are directly rendered.
    // For auto-layout frames as parent, groups are processed in the position-absolute.ts file. Groups are treated similarly to non-autolayout frames, with just a small change in the x/y calculation of children + the position mode is SCALE.
    // Note: skipping the group may not be desired if it contains masks. Behavior to investigate on Figma.
    // Also check the existing logic on group when not skipped. It may have an assumption on the use case (e.g. assumes it's absolute positioning), which may become wrong if we change the conditions here.
    if (isGroup(node) && (!parentIsAutoLayout || isGroup(parentNode))) {
      node.noLayoutWithChildren = true;
      recurseOnChildren(context, node, styles, true);
      return;
    }

    // Add common styles (text and tags)
    mapCommonStyles(context, node, styles);

    if (isText(node)) {
      prepareStylesOnTextSegments(context, node, styles);
      return;
    } else if (isVector(node)) {
      const { projectContext } = moduleContext;
      let svgContent = readSvg(context, node);
      if (!svgContent) {
        if (node.visible) {
          warnNode(node, 'BUG No SVG content, skipping.');
        }
        return;
      }

      const svgPathVarName = registerSvgForWrite(context, svgContent);

      addNodeStyles1(context, node, styles);

      node.svgPathVarName = svgPathVarName;
    } else if (isBlockNode(node)) {
      // Add tag styles
      mapTagStyles(context, node, styles);

      if (isChildrenMixin(node)) {
        recurseOnChildren(context, node, styles);
      }

      postMapStyles(context, node, styles);
    }
  } catch (error) {
    warnNode(node, 'Failed to generate node with error below. Skipping the node.');
    if (!env.isProd) {
      throw error;
    }
    // Production: don't block the process
    handleError(error);
    return;
  }
}

function addNodeStyles1(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  mapTagStyles(context, node, styles);
  styles = postMapStyles(context, node, styles);
  return styles;
}

function recurseOnChildren(
  context: NodeContext,
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
      let svgContent = readSvg(context, child);
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

  const { parentNode, parentStyles, parentContext, moduleContext } = context;
  for (const child of node.children) {
    if (child.skip) {
      continue;
    }
    const contextForChildren: NodeContext = {
      moduleContext,
      tagName: 'div', // Default value, will be overridden. To avoid undefined in typing.
      nodeNameLower: child.name.toLowerCase(),
      parentNode: passParentToChildContext ? parentNode : (node as FlexNode | GroupNode2),
      parentStyles: passParentToChildContext ? parentStyles : mergeWithInheritedStyles(context, styles),
      parentContext: passParentToChildContext ? parentContext : context,
      isRootInComponent: false,
    };
    prepareNode(contextForChildren, child);
  }
}

export function genNodeAst(node: SceneNode2) {
  try {
    const { nodeContext: context, styles, muiConfig, svgPathVarName, extraAttributes } = node;
    if (!context) throw new Error(`[genNodeAst] node ${node.name} has no nodeContext`);
    const { moduleContext } = context;

    if (node.skip) return;

    if (node.componentContext) {
      return genCompUsage(node);
    }

    if (!styles) {
      throw new Error(`[genNodeAst] node ${node.name} has no styles`);
    }

    if (muiConfig) {
      const node2 = node as InstanceNode2;
      const attributes = addNodeStyles(context, node2, styles);
      return mkMuiComponentAst(context, muiConfig, node2, attributes);
    }

    if (node.noLayoutWithChildren) {
      return genNodeAstLoopChildren(node);
    }

    if (isText(node)) {
      return genTextAst(node);
    } else if (isVector(node)) {
      if (!svgPathVarName) {
        if (node.visible) {
          console.warn(`BUG [genNodeAst] node ${node.name} has no svgPathVarName`);
        }
        return mkSwapInstanceAndHideWrapper(context, undefined, node);
      }

      let ast = createSvgAst(context, node, styles, svgPathVarName, true);
      return ast;
    } else if (isBlockNode(node)) {
      // the CSS rule is created before checking the children so that it appears first in the CSS file.
      // After generating the children, we can add the final list of rules or remove it if no rule.
      const cssRule = addCssRule(context, '_tmp');

      const children = genNodeAstLoopChildren(node);

      const styleDeclarations = stylesToList(styles);
      let attributes: ts.JsxAttribute[] = [];
      if (flags.writeFigmaIdOnNode) attributes.push(mkIdAttribute(node.id));
      if (styleDeclarations.length) {
        const className = getOrGenClassName(moduleContext, node);
        updateCssRuleClassName(context, cssRule, className);
        cssRule.block.children.push(...styleDeclarations);
        attributes.push(createClassAttrForNode(node));
      } else {
        removeCssRule(context, cssRule, node);
      }

      const ast2 = mkTag(context.tagName, [...attributes, ...(extraAttributes || [])], children || []);
      return mkWrapHideAndTextOverrideAst(context, ast2, node);
    }
    throw new Error(`[genNodeAst] Unsupported type for node ${node.name}`);
  } catch (error) {
    warnNode(node, '[genNodeAst] Failed to generate node with error below. Skipping the node.');
    if (!env.isProd) {
      throw error;
    }
    // Production: don't block the process
    handleError(error);
    return;
  }
}

function genNodeAstLoopChildren(node: SceneNode2) {
  if (!isChildrenMixin(node)) return;
  const childrenAst: ts.JsxChild[] = [];
  for (const child of node.children) {
    if (child.skip) {
      continue;
    }
    const childTsx = genNodeAst(child);
    if (childTsx) {
      if (Array.isArray(childTsx)) {
        childrenAst.push(...childTsx);
      } else {
        childrenAst.push(childTsx);
      }
    }
  }
  return childrenAst.length ? childrenAst : undefined;
}
