import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { SceneNodeNoMethod } from '../../../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from '../../code.model';
import {
  mkBlockCss,
  mkClassSelectorCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
} from '../../css-gen/css-factories-low';

const { factory } = ts;
const classImport = 'classes';

export function addCssRule(context: CodeContext, className: string, styles: DeclarationPlain[] = []) {
  const { cssRules } = context;
  const cssRule = mkRuleCss(mkSelectorListCss([mkSelectorCss([mkClassSelectorCss(className)])]), mkBlockCss(styles));
  cssRules.push(cssRule);
  return cssRule;
}

export function genClassName(context: CodeContext, node?: SceneNodeNoMethod, isRoot?: boolean) {
  const baseName = isRoot ? 'root' : node ? node.name : 'label';
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

export function mkFragment(children: ts.JsxChild[]) {
  return factory.createJsxFragment(factory.createJsxOpeningFragment(), children, factory.createJsxJsxClosingFragment());
}

export function mkTag(tagName: string, classAttr: ts.JsxAttribute[], children: ts.JsxChild[]) {
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

export function mkHrefAttr(url: string) {
  return factory.createJsxAttribute(factory.createIdentifier('href'), factory.createStringLiteral(url));
}

export function mkTargetBlankAttr() {
  return factory.createJsxAttribute(factory.createIdentifier('target'), factory.createStringLiteral('_blank'));
}
