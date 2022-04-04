import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { Dict, ExportCodePayload, SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { mapCommonStyles, mapTagStyles, mapTextStyles } from './5-figma-to-code-map';
import { ComponentContext, NodeContext } from './code.model';
import { getCompDirectory } from './create-ts-compiler/3-create-component';
import {
  isChildrenMixin,
  isFlexNode,
  isGroup,
  isRectangle,
  isText,
  isValidNode,
  isVector,
} from './create-ts-compiler/canvas-utils';
import { mkStylesheetCss } from './css-gen/css-factories-low';
import {
  addCssRule,
  genClassName,
  genImportName,
  mkClassAttr,
  mkImg,
  mkTag,
  removeCssRule,
} from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';
import { guessTagNameAndUpdateNode } from './smart-guesses/guessTagName';

export async function figmaToAstRootNode(componentContext: ComponentContext, { parent, root }: ExportCodePayload) {
  const nodeContext: NodeContext = {
    componentContext,
    tagName: 'div', // Default value
    nodeNameLower: root.name.toLowerCase(),
    parentNode: parent,
    parentStyles: null,
    parentContext: null,
  };
  const tsx = await figmaToAstRec(nodeContext, root, true);

  const cssAst = mkStylesheetCss(componentContext.cssRules);

  return [tsx, cssAst] as const;
}

async function figmaToAstRec(context: NodeContext, node: SceneNodeNoMethod, isRoot?: boolean) {
  if (!node.visible) {
    return;
  }

  mockUsefulMethods(node);

  const styles: Dict<DeclarationPlain> = {};

  const [newNode, extraAttributes] = guessTagNameAndUpdateNode(context, node, styles);
  if (newNode) node = newNode;

  if (!isValidNode(node) && !isGroup(node)) {
    warnNode(node, 'TODO Unsupported node');
    return;
  }

  // Group is a special case: we go through it without creating a div, we don't read props since there is almost nothing interesting in it.
  if (isGroup(node)) {
    const childrenAst: ts.JsxChild[] = [];
    for (const child of node.children) {
      const res = await figmaToAstRec(context, child);
      if (res) {
        if (Array.isArray(res)) {
          childrenAst.push(...res);
        } else {
          childrenAst.push(res);
        }
      }
    }
    return childrenAst.length ? childrenAst : undefined;
  }

  // Add common styles (text and tags)
  mapCommonStyles(context, node, styles);

  if (isText(node)) {
    // Add text styles
    let ast = mapTextStyles(context, node, styles);

    const flexStyles: Dict<DeclarationPlain> = {};
    mapTagStyles(context, node, flexStyles);

    if (!context.parentStyles || Object.keys(flexStyles).length) {
      const className = genClassName(context, node, isRoot);
      const styleDeclarations = [...Object.values(styles), ...Object.values(flexStyles)];
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
    const { projectContext, compName } = context.componentContext;
    // It is already a string, we have mocked it. We just reuse the interface for 90 % of the usages (much easier).
    let svgContent = (await node.exportAsync({ format: 'SVG' })) as unknown as string;
    // Remove width and height from SVG. Let the CSS define it.
    svgContent = svgContent.replace(/^<svg width="\d+" height="\d+"/, '<svg');

    // Add SVG file to resources to create the file later
    const svgPathVarName = genImportName(context);
    projectContext.resources[`${getCompDirectory(compName)}/${svgPathVarName}.svg`] = svgContent;

    // Add import in file
    context.componentContext.file.addImportDeclaration({
      moduleSpecifier: `./${svgPathVarName}.svg`,
      defaultImport: svgPathVarName,
    });

    // Add styles for this node
    const context2 = mapTagStyles(context, node, styles);
    const className = genClassName(context2, node, isRoot);
    const styleDeclarations = Object.values(styles);
    let attributes: ts.JsxAttribute[] = [];
    if (styleDeclarations.length) {
      addCssRule(context, className, styleDeclarations);
      attributes.push(mkClassAttr(className));
    }

    // Generate AST
    const ast = mkImg(svgPathVarName, attributes);
    return ast;
  } else if (isFlexNode(node) || isRectangle(node)) {
    // Add tag styles
    const context2 = mapTagStyles(context, node, styles);

    const className = genClassName(context2, node, isRoot);

    // the CSS rule is created before checking the children so that it appears first in the CSS file.
    // After generating the children, we can add the final list of rules or remove it if no rule.
    const cssRule = addCssRule(context2, className);

    const children: ts.JsxChild[] = [];
    if (isChildrenMixin(node) && Array.isArray(node.children)) {
      for (const child of node.children as SceneNode[]) {
        const contextForChildren: NodeContext = {
          componentContext: context2.componentContext,
          tagName: 'div', // Default value, will be overridden. Allows to keep a strong typing (no undefined).
          nodeNameLower: child.name.toLowerCase(),
          parentNode: node,
          parentStyles: styles,
          parentContext: context2,
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

    const styleDeclarations = Object.values(styles);
    let attributes: ts.JsxAttribute[] = [];
    if (styleDeclarations.length) {
      cssRule.block.children.push(...Object.values(styles));
      attributes.push(mkClassAttr(className));
    } else {
      removeCssRule(context, cssRule, node);
    }

    const tsx = mkTag(context2.tagName, [...attributes, ...extraAttributes], children);
    return tsx;
  }
}

function mockUsefulMethods(node: SceneNodeNoMethod) {
  if (isText(node)) {
    node.getStyledTextSegments = () => (node as any)._textSegments;
  }
  if (isVector(node)) {
    node.exportAsync = () => (node as any)._svg;
  }
}
