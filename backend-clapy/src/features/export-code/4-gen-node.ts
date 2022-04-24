import { transform } from '@svgr/core';
import { DeclarationPlain } from 'css-tree';
import ts from 'typescript';
import { env } from '../../env-and-config/env';
import { handleError } from '../../utils';
import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { genComponent } from './3-gen-component';
import { mapCommonStyles, mapTagStyles, mapTextStyles } from './5-figma-to-code-map';
import { getPrettierConfig } from './8-diagnose-format-ts-files';
import { JsxOneOrMore, NodeContext } from './code.model';
import { writeAsset } from './create-ts-compiler/2-write-asset';
import {
  BlockNode,
  ChildrenMixin2,
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
  genClassName,
  genComponentImportName,
  mkClassAttr,
  mkComponentUsage,
  mkNamedImportsDeclaration,
  mkTag,
  removeCssRule,
} from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';
import { addMuiImport, checkAndProcessMuiComponent, mkMuiComponentAst } from './frameworks/mui/mui-utils';
import { guessTagNameAndUpdateNode } from './smart-guesses/guessTagName';

export async function figmaToAstRec(context: NodeContext, node: SceneNode2, isRoot = false) {
  try {
    if (!node.visible) {
      return;
    }

    const { parentNode, componentContext } = context;

    const styles: Dict<DeclarationPlain> = {};

    const muiConfig = checkAndProcessMuiComponent(context, node);
    if (muiConfig) {
      context.outerLayoutOnly = true;
      const node2 = node as InstanceNode2;
      addMuiImport(componentContext, muiConfig);

      // Add tag styles
      mapCommonStyles(context, node2, styles);
      const attributes = addNodeStyles(context, node2, styles, isRoot);

      return mkMuiComponentAst(context, muiConfig, node2, attributes);
    }

    // If component or instance, generate the code in a separate component file and reference it here.
    if (isComponent(node) || isInstance(node)) {
      // Change to frame to avoid infinite loops: don't re-extract the component.
      // Components and instances are actually frames, so there shouldn't be any impact.
      const node2 = { ...node, type: 'FRAME' as const };
      const genComponentContext = await genComponent(componentContext, node2, context.parentNode);
      return mkComponentUsage(genComponentContext.compName);
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
      await recurseOnChildren(context, node, childrenAst, styles, true);
      return childrenAst.length ? childrenAst : undefined;
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
        const className = genClassName(context, node, isRoot);
        const styleDeclarations = [...stylesToList(styles), ...stylesToList(flexStyles)];
        let attributes: ts.JsxAttribute[] = [];
        if (styleDeclarations.length) {
          addCssRule(context, className, styleDeclarations);
          attributes.push(mkClassAttr(className));
        }
        ast = mkTag('div', attributes, Array.isArray(ast) ? ast : [ast]);
      } else {
        Object.assign(context.parentStyles, styles);
        // Later, here, we can add the code that will handle conflicts between parent node and child text nodes,
        // i.e. if the text node has different (and conflicting) styles with the parent (that potentially still need its style to apply to itself and/or siblings of the text node), then add an intermediate DOM node and apply the text style on it.

        // return txt;
      }
      return ast;
    } else if (isVector(node)) {
      const { projectContext } = componentContext;
      let svgContent = readSvg(node);
      if (!svgContent) {
        warnNode(node, 'BUG No SVG content, skipping.');
        return;
      }

      const svgPathVarName = genComponentImportName(context);

      const svgTsCode = await transform(
        svgContent,
        {
          typescript: true,
          exportType: 'named',
          namedExport: svgPathVarName,
          jsxRuntime: 'automatic',
          dimensions: false,
          memo: true,
          // svgo could be useful to optimise the SVGs. To try later.
          plugins: [/* '@svgr/plugin-svgo', */ '@svgr/plugin-jsx', '@svgr/plugin-prettier'],
          prettierConfig: await getPrettierConfig(),
        },
        { componentName: svgPathVarName },
      );

      // Add SVG as React component. It's the preferred solution over img pointing to SVG file because overflow: visible works as direct SVG and doesn't through img (if the SVG paints content outside the viewbox, which works on Figma).
      projectContext.resources[`${componentContext.compDir}/${svgPathVarName}.tsx`] = svgTsCode;

      // Add import in file
      componentContext.imports.push(mkNamedImportsDeclaration([svgPathVarName], `./${svgPathVarName}`));

      const attributes = addNodeStyles(context, node, styles, isRoot);

      // Generate AST
      const ast = mkComponentUsage(svgPathVarName, attributes);
      return ast;
    } else if (isBlockNode(node)) {
      const [context2, attributes, children] = await generateBlockAst(context, node, styles, isRoot);
      const tsx = mkTag(context2.tagName, [...attributes, ...extraAttributes], children);
      return tsx;
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

function addNodeStyles(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>, isRoot: boolean) {
  mapTagStyles(context, node, styles);
  const className = genClassName(context, node, isRoot);
  const styleDeclarations = stylesToList(styles);
  let attributes: ts.JsxAttribute[] = [];
  if (styleDeclarations.length) {
    addCssRule(context, className, styleDeclarations);
    attributes.push(mkClassAttr(className));
  }
  return attributes;
}

async function generateBlockAst(
  context: NodeContext,
  node: BlockNode,
  styles: Dict<DeclarationPlain>,
  isRoot?: boolean,
) {
  // Add tag styles
  mapTagStyles(context, node, styles);

  const className = genClassName(context, node, isRoot);

  // the CSS rule is created before checking the children so that it appears first in the CSS file.
  // After generating the children, we can add the final list of rules or remove it if no rule.
  const cssRule = addCssRule(context, className);

  const children: ts.JsxChild[] = [];
  if (isChildrenMixin(node)) {
    await recurseOnChildren(context, node, children, styles);
  }

  const styleDeclarations = stylesToList(styles);
  let attributes: ts.JsxAttribute[] = [];
  if (styleDeclarations.length) {
    cssRule.block.children.push(...styleDeclarations);
    attributes.push(mkClassAttr(className));
  } else {
    removeCssRule(context, cssRule, node);
  }

  return [context, attributes, children] as const;
}

async function recurseOnChildren(
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

  const { parentNode, parentStyles, parentContext, componentContext } = context;
  for (const child of node.children) {
    if (child.skip) {
      continue;
    }
    const contextForChildren: NodeContext = {
      componentContext,
      tagName: 'div', // Default value, will be overridden. Allows to keep a strong typing (no undefined).
      nodeNameLower: child.name.toLowerCase(),
      parentNode: passParentToChildContext ? parentNode : (node as FlexNode | GroupNode2),
      parentStyles: passParentToChildContext ? parentStyles : styles,
      parentContext: passParentToChildContext ? parentContext : context,
    };
    const childTsx = await figmaToAstRec(contextForChildren, child);
    if (childTsx) {
      if (Array.isArray(childTsx)) {
        children.push(...childTsx);
      } else {
        children.push(childTsx);
      }
    }
  }
}
