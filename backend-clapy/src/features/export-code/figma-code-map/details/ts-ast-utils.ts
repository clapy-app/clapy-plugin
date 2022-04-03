import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { SceneNodeNoMethod } from '../../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../../code.model';
import {
  mkBlockCss,
  mkClassSelectorCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
} from '../../css-gen/css-factories-low';

const { factory } = ts;
const classImport = 'classes';

export function addCssRule(context: NodeContext, className: string, styles: DeclarationPlain[] = []) {
  const { cssRules } = context.componentContext;
  const cssRule = mkRuleCss(mkSelectorListCss([mkSelectorCss([mkClassSelectorCss(className)])]), mkBlockCss(styles));
  cssRules.push(cssRule);
  return cssRule;
}

export function genClassName(context: NodeContext, node?: SceneNodeNoMethod, isRoot?: boolean) {
  // No node when working on text segments. But can we find better class names than 'label' for this case?
  const baseName = isRoot ? 'root' : node?.name ? node.name : 'label';
  return genUniqueName(context.componentContext.classNamesAlreadyUsed, baseName);
}

export function genImportName(context: NodeContext) {
  // The variable is generated from the node name. But 'icon' is a bad variable name. If that's the node name, let's use the parent instead.
  let baseName =
    context.nodeNameLower === 'icon' && context.parentContext?.nodeNameLower
      ? context.parentContext?.nodeNameLower
      : context.nodeNameLower;
  if (baseName !== 'icon') {
    baseName = `${baseName}Icon`;
  }
  return genUniqueName(context.componentContext.importNamesAlreadyUsed, baseName);
}

export function genUniqueName(usageCache: Set<string>, baseName: string, pascalCase = false) {
  const sanitize = pascalCase ? pascalize : camelize;
  let name = sanitize(baseName);
  let i = 1;
  while (usageCache.has(name)) {
    ++i;
    name = `${sanitize(baseName)}_${i}`;
  }
  usageCache.add(name);
  return name;
}

// TODO delete? Unused?
function sanitizeClassName(name: string) {
  return camelize(name);
  // Inspiration: https://stackoverflow.com/a/7627603/4053349
  // return name.replace(/[^a-z0-9]/gi, '_');
}

// https://stackoverflow.com/a/2970667/4053349
function pascalize(str: string) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+|[^\w])/g, match => {
    if (+match === 0 || !/\w/.test(match)) return ''; // or if (/\s+/.test(match)) for white spaces
    return match.toUpperCase();
  });
}

function camelize(str: string) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+|[^\w])/g, (match, index) => {
    if (+match === 0 || !/\w/.test(match)) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function mkFragment(children: ts.JsxChild[]) {
  return factory.createJsxFragment(factory.createJsxOpeningFragment(), children, factory.createJsxJsxClosingFragment());
}

export function mkTag(tagName: string, classAttr: ts.JsxAttribute[] | null, children: ts.JsxChild[] | null) {
  return factory.createJsxElement(
    factory.createJsxOpeningElement(
      factory.createIdentifier(tagName),
      undefined,
      factory.createJsxAttributes(classAttr ?? []),
    ),
    children ?? [],
    factory.createJsxClosingElement(factory.createIdentifier(tagName)),
  );
}

export function mkClassAttr(classVarName: string) {
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

export function mkInputTypeAttr(value = 'checkbox') {
  return factory.createJsxAttribute(factory.createIdentifier('type'), factory.createStringLiteral(value));
}

export function mkHrefAttr(url: string) {
  return factory.createJsxAttribute(factory.createIdentifier('href'), factory.createStringLiteral(url));
}

export function mkTargetBlankAttr() {
  return factory.createJsxAttribute(factory.createIdentifier('target'), factory.createStringLiteral('_blank'));
}

export function mkImg(srcVarName: string, ...extraAttributes: ts.JsxAttribute[]) {
  return factory.createJsxSelfClosingElement(
    factory.createIdentifier('img'),
    undefined,
    factory.createJsxAttributes([
      factory.createJsxAttribute(
        factory.createIdentifier('src'),
        factory.createJsxExpression(undefined, factory.createIdentifier(srcVarName)),
      ),
      ...extraAttributes,
    ]),
  );
}
