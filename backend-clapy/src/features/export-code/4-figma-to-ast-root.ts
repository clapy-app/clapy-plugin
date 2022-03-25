import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { Nil } from '../../common/general-utils';
import { Dict, SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from './code.model';
import { isComponent, isFrame, isGroup, isInstance, isText } from './create-ts-compiler/canvas-utils';
import { printStandalone } from './create-ts-compiler/parsing.utils';
import {
  mkBlockCss,
  mkClassSelectorCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
  mkStylesheetCss,
} from './css-gen/css-factories-low';
import { mapCommonStyles, mapTagStyles, mapTextStyles } from './figma-to-ast/figma-to-ast-map';

const { factory } = ts;
const classImport = 'classes';

export function figmaToAstRootNode(node: SceneNodeNoMethod) {
  const context: CodeContext = {
    cssRules: [],
    classNamesAlreadyUsed: new Set(),
  };

  const tsx = figmaToAstRec(context, node, true); //

  const cssAst = mkStylesheetCss(context.cssRules);

  return [tsx, cssAst] as const;
}

export function figmaToAstRec(context: CodeContext, node: SceneNodeNoMethod, isRoot?: boolean) {
  const tagName = guessTagName(context, node);
  if (tagName === 'button') {
    context = { ...context, inButton: true };
  }

  const stylesMap: Dict<DeclarationPlain> = {};

  // Add common styles (text and tags)
  mapCommonStyles(context, node, stylesMap);

  if (isText(node)) {
    // Add text styles
    mapTextStyles(context, node, stylesMap);

    const txt = factory.createJsxText(node.characters, false);
    if (!context.parentStylesMap) {
      const className = genClassName(context, node, isRoot);
      addCssRule(context, className, Object.values(stylesMap));
      return mkTag('div', [], [txt]);
    } else {
      Object.assign(context.parentStylesMap, stylesMap);
      // Later, here, we can add the code that will handle conflicts between parent node and child text nodes,
      // i.e. if the text node has different (and conflicting) styles with the parent (that potentially still need its style to apply to itself and/or siblings of the text node), then add an intermediate DOM node and apply the text style on it.
      return txt;
    }
  } else if (isFrame(node) || isComponent(node) || isInstance(node) || isGroup(node)) {
    // Add tag styles
    mapTagStyles(context, node, stylesMap);

    const className = genClassName(context, node, isRoot);

    const cssRule = addCssRule(context, className);

    const contextForChildren: CodeContext = { ...context, parentStylesMap: stylesMap };
    const children: ts.JsxChild[] = [];
    if (isChildrenMixin(node) && Array.isArray(node.children)) {
      for (const child of node.children as SceneNode[]) {
        const childTsx = figmaToAstRec(contextForChildren, child);
        if (childTsx) {
          printStandalone(childTsx);
          children.push(childTsx);
        }
      }
    }

    cssRule.block.children.push(...Object.values(stylesMap));

    const classAttr = mkClassAttr(className);
    const tsx = mkTag(tagName, [classAttr], children);
    return tsx;
  } else {
    console.warn('Unsupported node', node.name, node.type);
  }
}

function addCssRule(context: CodeContext, className: string, styles: DeclarationPlain[] = []) {
  const { cssRules } = context;
  const cssRule = mkRuleCss(mkSelectorListCss([mkSelectorCss([mkClassSelectorCss(className)])]), mkBlockCss(styles));
  cssRules.push(cssRule);
  return cssRule;
}

function genClassName(context: CodeContext, node: SceneNodeNoMethod, isRoot?: boolean) {
  const baseName = isRoot ? 'root' : node.name;
  let name = sanitizeClassName(baseName);
  let i = 0;
  while (context.classNamesAlreadyUsed.has(name)) {
    ++i;
    name = `${sanitizeClassName(baseName)}_${i}`;
  }
  context.classNamesAlreadyUsed.add(name);
  return name;
}

function sanitizeClassName(name: string) {
  // Inspiration: https://stackoverflow.com/a/7627603/4053349
  return name.replace(/[^a-z0-9]/gi, '_');
}

export function isChildrenMixin(node: SceneNodeNoMethod | ChildrenMixin | Nil): node is ChildrenMixin {
  return !!(node as ChildrenMixin)?.children;
}

function mkTag(tagName: string, classAttr: ts.JsxAttribute[], children: ts.JsxChild[]) {
  return factory.createJsxElement(
    factory.createJsxOpeningElement(
      factory.createIdentifier(tagName),
      undefined,
      factory.createJsxAttributes(classAttr),
    ),
    children,
    factory.createJsxClosingElement(factory.createIdentifier(tagName)),
  );
}

function mkClassAttr(classVarName: string) {
  return factory.createJsxAttribute(
    factory.createIdentifier('className'),
    factory.createJsxExpression(
      undefined,
      factory.createPropertyAccessExpression(
        factory.createIdentifier(classImport),
        factory.createIdentifier(classVarName),
      ),
    ),
  );
}

function guessTagName(context: CodeContext, node: SceneNodeNoMethod) {
  const name = node.name.toLowerCase();
  if (!context.inButton && (name === 'button' || (name.includes('button') && !name.includes('wrapper')))) {
    return 'button';
  }
  return 'div';
}
