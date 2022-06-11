import { DeclarationPlain } from 'css-tree';
import ts from 'typescript';

import { flags } from '../../env-and-config/app-config';
import { env } from '../../env-and-config/env';
import { handleError } from '../../utils';
import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { getOrGenComponent } from './3-gen-component';
import { genInstanceOverrides } from './5-instance-overrides';
import { mapCommonStyles, mapTagStyles, postMapStyles } from './6-figma-to-code-map';
import { InstanceContext, JsxOneOrMore, NodeContext, SwapAst } from './code.model';
import { writeAsset } from './create-ts-compiler/2-write-asset';
import {
  ChildrenMixin2,
  ComponentNode2,
  FlexNode,
  GroupNode2,
  InstanceNode2,
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
  Masker,
  SceneNode2,
  ValidNode,
} from './create-ts-compiler/canvas-utils';
import { stylesToList } from './css-gen/css-type-utils';
import { readSvg } from './figma-code-map/details/process-nodes-utils';
import {
  addCssRule,
  createClassAttrForNode,
  createComponentUsageWithAttributes,
  createTextAst,
  genComponentImportName,
  getOrCreateCompContext,
  getOrGenClassName,
  mkComponentUsage,
  mkNamedImportsDeclaration,
  mkSwapInstanceAndHideWrapper,
  mkTag,
  mkWrapHideAndTextOverrideAst,
  removeCssRule,
} from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';
import { addMuiImport, checkAndProcessMuiComponent, mkMuiComponentAst } from './frameworks/mui/mui-utils';
import { guessTagNameAndUpdateNode } from './smart-guesses/guessTagName';

export function figmaToAstRec(context: NodeContext, node: SceneNode2) {
  try {
    if (!node.visible && context.moduleContext.isRootComponent) {
      return;
    }

    const { parentNode, moduleContext, isRootInComponent } = context;

    let styles: Dict<DeclarationPlain> = {};

    let muiConfig = checkAndProcessMuiComponent(context, node);
    if (muiConfig) {
      context.outerLayoutOnly = true;
      const node2 = node as InstanceNode2;
      muiConfig = addMuiImport(moduleContext, muiConfig);

      // Add tag styles
      mapCommonStyles(context, node2, styles);
      const attributes = addNodeStyles(context, node2, styles);

      return mkMuiComponentAst(context, muiConfig, node2, attributes);
    }

    // If component or instance, generate the code in a separate component file and reference it here.
    const isComp = isComponent(node);
    const isInst = isInstance(node);
    if (!isRootInComponent && (isComp || isInst)) {
      const componentContext = getOrGenComponent(moduleContext, node, parentNode);

      if (!flags.enableInstanceOverrides) {
        return mkComponentUsage(componentContext.compName);
      }

      const instanceNode = node as ComponentNode2 | InstanceNode2;
      // Get the styles for all instance overrides. Styles only, for all nodes. No need to generate any AST.
      const instanceContext: InstanceContext = {
        ...context,
        componentContext,
        nodeOfComp: componentContext.node,
        intermediateInstanceNodeOfComps: [instanceNode],
        intermediateComponentContexts: [moduleContext, componentContext],
        intermediateNodes: [node, componentContext.node],
        instanceNode,
        instanceNodeOfComp: instanceNode,
        isRootInComponent: true,
      };

      // When checking overrides, in addition to classes, we also check the swapped instances.
      genInstanceOverrides(instanceContext, node);

      const compContext = getOrCreateCompContext(node);

      let compAst = createComponentUsageWithAttributes(compContext, componentContext, node);

      // Surround instance usage with a syntax to swap with render props
      let compAst2: SwapAst | JsxOneOrMore = compAst;
      if (isInst) {
        // Should we also check that we're in a component? To review with examples.
        compAst2 = mkSwapInstanceAndHideWrapper(context, compAst, node);
      }

      return compAst2;
    }

    const [newNode, extraAttributes] = guessTagNameAndUpdateNode(context, node, styles);
    if (newNode) node = newNode;

    if (!isValidNode(node) && !isGroup(node)) {
      warnNode(node, 'TODO Unsupported node');
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
      const childrenAst: ts.JsxChild[] = [];
      recurseOnChildren(context, node, childrenAst, styles, true);
      return childrenAst.length ? childrenAst : undefined;
    }

    // Add common styles (text and tags)
    mapCommonStyles(context, node, styles);

    if (isText(node)) {
      const ast = createTextAst(context, node, styles);
      return ast ? mkWrapHideAndTextOverrideAst(context, ast, node) : undefined;
    } else if (isVector(node)) {
      const { projectContext } = moduleContext;
      let svgContent = readSvg(node);
      if (!svgContent) {
        warnNode(node, 'BUG No SVG content, skipping.');
        return;
      }

      const svgPathVarName = genComponentImportName(context);

      // Save SVG to convert to React component later, so that we isolate the execution time, which is significant (second most expensive after Prettier formatting).
      projectContext.svgToWrite[`${moduleContext.compDir}/${svgPathVarName}.tsx`] = {
        svgPathVarName,
        svgContent,
      };
      // console.log(svgContent);

      // Add import in file
      moduleContext.imports[svgPathVarName] = mkNamedImportsDeclaration([svgPathVarName], `./${svgPathVarName}`);

      const attributes = addNodeStyles(context, node, styles);

      // Generate AST
      const ast = mkComponentUsage(svgPathVarName, attributes);
      return mkWrapHideAndTextOverrideAst(context, ast, node);
    } else if (isBlockNode(node)) {
      // Add tag styles
      mapTagStyles(context, node, styles);

      const className = getOrGenClassName(moduleContext, node);

      // the CSS rule is created before checking the children so that it appears first in the CSS file.
      // After generating the children, we can add the final list of rules or remove it if no rule.
      const cssRule = addCssRule(context, className);

      const children: ts.JsxChild[] = [];
      if (isChildrenMixin(node)) {
        recurseOnChildren(context, node, children, styles);
      }

      styles = postMapStyles(context, node, styles);
      const styleDeclarations = stylesToList(styles);
      let attributes: ts.JsxAttribute[] = [];
      if (styleDeclarations.length) {
        cssRule.block.children.push(...styleDeclarations);
        attributes.push(createClassAttrForNode(node));
      } else {
        removeCssRule(context, cssRule, node);
      }

      const ast2 = mkTag(context.tagName, [...attributes, ...extraAttributes], children);
      return mkWrapHideAndTextOverrideAst(context, ast2, node);
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

function addNodeStyles(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const { moduleContext } = context;
  mapTagStyles(context, node, styles);
  const className = getOrGenClassName(moduleContext, node);
  styles = postMapStyles(context, node, styles);
  const styleDeclarations = stylesToList(styles);
  let attributes: ts.JsxAttribute[] = [];
  if (styleDeclarations.length) {
    addCssRule(context, className, styleDeclarations);
    attributes.push(createClassAttrForNode(node));
  }
  return attributes;
}

function recurseOnChildren(
  context: NodeContext,
  node: SceneNode2 & ChildrenMixin2,
  children: ts.JsxChild[],
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
      parentStyles: passParentToChildContext ? parentStyles : styles,
      parentContext: passParentToChildContext ? parentContext : context,
      isRootInComponent: false,
    };
    const childTsx = figmaToAstRec(contextForChildren, child);
    if (childTsx) {
      if (Array.isArray(childTsx)) {
        children.push(...childTsx);
      } else {
        children.push(childTsx);
      }
    }
  }
}
