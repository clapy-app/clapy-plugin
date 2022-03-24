import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { Nil } from '../../common/general-utils';
import { Dict, SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { isText } from './create-ts-compiler/canvas-utils';
import { printStandalone } from './create-ts-compiler/parsing.utils';
import {
  CssRootNode,
  mkBlockCss,
  mkClassSelectorCss,
  mkDeclarationCss,
  mkIdentifierCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
  mkStylesheetCss,
  mkValueCss,
} from './css-gen/css-factories';

const { factory } = ts;
const classImport = 'classes';

interface CodeContext {
  cssRules: CssRootNode[];
  classNamesAlreadyUsed: Set<string>;
  inButton?: boolean;
  parentStylesMap?: Dict<DeclarationPlain>;
}

export function figmaToAst(node: SceneNodeNoMethod) {
  const context: CodeContext = {
    cssRules: [],
    classNamesAlreadyUsed: new Set(),
  };

  const tsx = figmaToAstRec(context, node, true); //

  const cssAst = mkStylesheetCss(context.cssRules);

  // TODO 2) convert attributes to CSS

  return [tsx, cssAst] as const;
}
export function figmaToAstRec(context: CodeContext, node: SceneNodeNoMethod, isRoot?: boolean) {
  const { cssRules } = context;
  const tagName = guessTagName(context, node);
  if (tagName === 'button') {
    context = { ...context, inButton: true };
  }

  const stylesMap: Dict<DeclarationPlain> = {
    display: mkDeclarationCss('display', mkValueCss([mkIdentifierCss('flex')])),
  };

  if (isText(node)) {
    // TODO push styles to parent cssRule
    const txt = factory.createJsxText(node.characters, false);
    if (!context.parentStylesMap) {
      const className = genClassName(context, node, isRoot);
      addCssRule(context, className, Object.values(stylesMap));
      return mkTag('div', [], [txt]);
    } else {
      stylesMap['flex-direction'] = mkDeclarationCss('flex-direction', mkValueCss([mkIdentifierCss('row')]));
      Object.assign(context.parentStylesMap, stylesMap);
      // Later, here, we can add the code that will handle conflicts between parent node and child text nodes,
      // i.e. if the text node has different (and conflicting) styles with the parent (that potentially still need its style to apply to itself and/or siblings of the text node), then add an intermediate DOM node and apply the text style on it.
      return txt;
    }
  } else {
    const className = genClassName(context, node, isRoot);

    const cssRule = addCssRule(context, className);

    const contextForChildren: CodeContext = { ...context, parentStylesMap: stylesMap };
    const children: ts.JsxChild[] = [];
    if (isChildrenMixin(node) && Array.isArray(node.children)) {
      for (const child of node.children) {
        const childTsx = figmaToAstRec(contextForChildren, child);
        printStandalone(childTsx);
        children.push(childTsx);
      }
    }
    // children.push(factory.createJsxText('Sign up', false));

    cssRule.block.children.push(...Object.values(stylesMap));

    const classAttr = mkClassAttr(className);
    const tsx = mkTag(tagName, [classAttr], children);
    return tsx;
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
