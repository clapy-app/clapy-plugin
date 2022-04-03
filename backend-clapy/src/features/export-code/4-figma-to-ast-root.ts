import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { Dict, SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { mapCommonStyles, mapTagStyles, mapTextStyles } from './5-figma-to-code-map';
import { ComponentContext, NodeContext } from './code.model';
import { isChildrenMixin, isFlexNode, isText, isVector } from './create-ts-compiler/canvas-utils';
import { mkStylesheetCss } from './css-gen/css-factories-low';
import { addCssRule, genClassName, mkClassAttr, mkTag } from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';
import { guessTagNameAndUpdateNode } from './smart-guesses/guessTagName';

export async function figmaToAstRootNode(componentContext: ComponentContext, node: SceneNodeNoMethod) {
  const nodeContext: NodeContext = {
    componentContext,
    tagName: 'div', // Default value
    nodeNameLower: node.name.toLowerCase(),
    parentNode: null,
    parentStyles: null,
    parentContext: null,
  };
  const tsx = await figmaToAstRec(nodeContext, node, true);

  const cssAst = mkStylesheetCss(componentContext.cssRules);

  return [tsx, cssAst] as const;
}

// ok TODO separate ComponentContext and NodeContext. The latter has a ref to the former
// -- TODO refactor styles to store in simple object instead of CSS AST obj? Is it that different? Maybe not.
// TODO I should reuse FlexNode functions, see if any CSS rule was applied, if yes create the intermediate node

// Array<keyof Intersect<FlexNode, TextNode>>
export const layoutRulesOnTextForWrapper: Array<keyof TextNode> = [
  // ''
];

async function figmaToAstRec(context: NodeContext, node: SceneNodeNoMethod, isRoot?: boolean) {
  if (!node.visible) {
    return;
  }

  mockUsefulMethods(node);

  const styles: Dict<DeclarationPlain> = {};

  const [newNode, extraAttributes] = guessTagNameAndUpdateNode(context, node, styles);
  if (newNode) node = newNode;

  if (!isText(node) && !isFlexNode(node) && !isVector(node)) {
    warnNode(node, 'TODO Unsupported node');
    return;
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
      addCssRule(context, className, [...Object.values(styles), ...Object.values(flexStyles)]);
      const classAttr = mkClassAttr(className);
      ast = mkTag('div', [classAttr], Array.isArray(ast) ? ast : [ast]);
    } else {
      Object.assign(context.parentStyles, styles);
      // Later, here, we can add the code that will handle conflicts between parent node and child text nodes,
      // i.e. if the text node has different (and conflicting) styles with the parent (that potentially still need its style to apply to itself and/or siblings of the text node), then add an intermediate DOM node and apply the text style on it.

      // return txt;
    }
    return ast;
  } else if (isVector(node)) {
    const svg = await node.exportAsync({ format: 'SVG' });
    // console.log('svg:', svg);
  } else if (isFlexNode(node)) {
    // Add tag styles
    const contextWithBorders = mapTagStyles(context, node, styles);

    const className = genClassName(context, node, isRoot);

    const cssRule = addCssRule(context, className);

    const children: ts.JsxChild[] = [];
    if (isChildrenMixin(node) && Array.isArray(node.children)) {
      for (const child of node.children as SceneNode[]) {
        const contextForChildren: NodeContext = {
          componentContext: context.componentContext,
          tagName: 'div', // Default value, will be overridden. Allows to keep a strong typing (no undefined).
          nodeNameLower: child.name.toLowerCase(),
          parentNode: node,
          parentStyles: styles,
          parentContext: contextWithBorders,
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

    cssRule.block.children.push(...Object.values(styles));

    const classAttr = mkClassAttr(className);
    const tsx = mkTag(context.tagName, [...extraAttributes, classAttr], children);
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
