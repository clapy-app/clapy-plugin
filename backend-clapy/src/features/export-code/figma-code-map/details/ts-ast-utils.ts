import { DeclarationPlain, RulePlain } from 'css-tree';
import ts, { Statement } from 'typescript';

import { flags } from '../../../../env-and-config/app-config';
import { Dict, SceneNodeNoMethod } from '../../../sb-serialize-preview/sb-serialize.model';
import { JsxOneOrMore, NodeContext } from '../../code.model';
import { SceneNode2 } from '../../create-ts-compiler/canvas-utils';
import {
  mkBlockCss,
  mkClassSelectorCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
} from '../../css-gen/css-factories-low';
import { warnNode } from './utils-and-reset';

const { factory } = ts;

export function addCssRule(context: NodeContext, className: string, styles: DeclarationPlain[] = []) {
  const { cssRules } = context.moduleContext;
  const cssRule = mkRuleCss(mkSelectorListCss([mkSelectorCss([mkClassSelectorCss(className)])]), mkBlockCss(styles));
  cssRules.push(cssRule);
  return cssRule;
}

export function removeCssRule(context: NodeContext, cssRule: RulePlain, node: SceneNodeNoMethod) {
  const { cssRules } = context.moduleContext;
  const i = cssRules.indexOf(cssRule);
  if (i === -1) {
    warnNode(node, 'Trying to remove CSS rule but it is not found in its parent:', JSON.stringify(cssRule));
    return;
  }
  cssRules.splice(i, 1);
}

export function genClassName(context: NodeContext, node?: SceneNode2, isRoot?: boolean, defaultClassName = 'label') {
  // No node when working on text segments. But can we find better class names than 'label' for this case?
  const baseName = isRoot ? 'root' : node?.name ? node.name : defaultClassName;
  const className = genUniqueName(context.moduleContext.classNamesAlreadyUsed, baseName);
  if (node && !node.className) {
    node.className = className;
    if (!isRoot) {
      // Beware, the below code is also run for instance overrides and text classes (6-figma-to-code-mapa.ts),
      // which might be undesired. To review with test cases.
      context.moduleContext.classes.add(className);
    }
  }
  return className;
}

export function genComponentImportName(context: NodeContext) {
  // The variable is generated from the node name. But 'icon' is a bad variable name. If that's the node name, let's use the parent instead.
  let baseName =
    context.nodeNameLower === 'icon' && context.parentContext?.nodeNameLower
      ? context.parentContext?.nodeNameLower
      : context.nodeNameLower;
  if (baseName !== 'icon') {
    baseName = `${baseName}Icon`;
  }
  return genUniqueName(context.moduleContext.subComponentNamesAlreadyUsed, baseName, true);
}

export function genUniqueName(usageCache: Set<string>, baseName: string, pascalCase = false) {
  const sanitize = pascalCase ? pascalize : camelize;
  const sanitizedName = sanitize(baseName) || 'unnamed';
  let name = sanitizedName;
  let i = 1;
  while (usageCache.has(name)) {
    ++i;
    name = `${sanitizedName}${i}`;
  }
  usageCache.add(name);
  return name;
}

// https://stackoverflow.com/a/2970667/4053349
function pascalize(str: string) {
  return prefixIfNumber(
    removeAccents(str)
      .replace(/(?:^\w|[A-Z]|\b\w|\s+|[^\w])/g, match => {
        if (+match === 0 || !/\w/.test(match)) return ''; // or if (/\s+/.test(match)) for white spaces
        return match.toUpperCase();
      })
      // Truncate if variable name is too long
      .substring(0, 30),
  );
}

function camelize(str: string) {
  return prefixIfNumber(
    removeAccents(str)
      .replace(/(?:^\w|[A-Z]|\b\w|\s+|[^\w])/g, (match, index) => {
        if (+match === 0 || !/\w/.test(match)) return ''; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      })
      // Truncate if variable name is too long
      .substring(0, 30),
  );
}

function removeAccents(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function prefixIfNumber(varName: string) {
  return varName.match(/^\d/) ? `_${varName}` : varName;
}

// AST generation functions

export function mkSimpleImportDeclaration(moduleSpecifier: string) {
  return factory.createImportDeclaration(
    undefined,
    undefined,
    undefined,
    factory.createStringLiteral(moduleSpecifier),
    undefined,
  );
}

export function mkDefaultImportDeclaration(importClauseName: string, moduleSpecifier: string) {
  return factory.createImportDeclaration(
    undefined,
    undefined,
    factory.createImportClause(false, factory.createIdentifier(importClauseName), undefined),
    factory.createStringLiteral(moduleSpecifier),
    undefined,
  );
}

export function mkNamedImportsDeclaration(
  importSpecifierNames: (string | [string, string])[],
  moduleSpecifier: string,
) {
  return factory.createImportDeclaration(
    undefined,
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports(
        importSpecifierNames.map(name =>
          typeof name === 'string'
            ? factory.createImportSpecifier(false, undefined, factory.createIdentifier(name))
            : factory.createImportSpecifier(
                false,
                factory.createIdentifier(name[0]),
                factory.createIdentifier(name[1]),
              ),
        ),
      ),
    ),
    factory.createStringLiteral(moduleSpecifier),
    undefined,
  );
}

export function mkPropInterface(classes: string[]) {
  return factory.createInterfaceDeclaration(
    undefined,
    undefined,
    factory.createIdentifier('Props'),
    undefined,
    undefined,
    [
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier('className'),
        factory.createToken(ts.SyntaxKind.QuestionToken),
        factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ),
      ...(!classes?.length
        ? []
        : [
            factory.createPropertySignature(
              undefined,
              factory.createIdentifier('classes'),
              factory.createToken(ts.SyntaxKind.QuestionToken),
              factory.createTypeLiteralNode(
                classes.map(name =>
                  factory.createPropertySignature(
                    undefined,
                    factory.createIdentifier(name),
                    factory.createToken(ts.SyntaxKind.QuestionToken),
                    factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                  ),
                ),
              ),
            ),
          ]),
    ],
  );
}

export function mkCompFunction(
  fnName: string,
  classes: string[],
  tsx: JsxOneOrMore | undefined,
  prefixStatements: Statement[] = [],
) {
  let returnedExpression: ts.Expression | undefined = undefined;
  if (tsx) {
    if (Array.isArray(tsx)) {
      returnedExpression = mkFragment(tsx);
    } else if (ts.isJsxText(tsx)) {
      returnedExpression = mkFragment([tsx]);
    } else {
      returnedExpression = tsx;
    }
  } else {
    returnedExpression = ts.factory.createNull();
  }

  return factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(fnName),
          undefined,
          factory.createTypeReferenceNode(factory.createIdentifier('FC'), [
            factory.createTypeReferenceNode(factory.createIdentifier('Props'), undefined),
          ]),
          factory.createCallExpression(factory.createIdentifier('memo'), undefined, [
            factory.createFunctionExpression(
              undefined,
              undefined,
              factory.createIdentifier(fnName),
              undefined,
              [
                factory.createParameterDeclaration(
                  undefined,
                  undefined,
                  undefined,
                  factory.createIdentifier('props'),
                  undefined,
                  undefined,
                  factory.createObjectLiteralExpression([], false),
                ),
              ],
              undefined,
              factory.createBlock(
                [
                  ...prefixStatements,
                  ...(flags.destructureClassNames
                    ? [
                        factory.createVariableStatement(
                          undefined,
                          factory.createVariableDeclarationList(
                            [
                              factory.createVariableDeclaration(
                                factory.createObjectBindingPattern([
                                  factory.createBindingElement(
                                    undefined,
                                    undefined,
                                    factory.createIdentifier('className'),
                                    undefined,
                                  ),
                                  ...(!classes?.length
                                    ? []
                                    : [
                                        factory.createBindingElement(
                                          undefined,
                                          factory.createIdentifier('classes'),
                                          factory.createObjectBindingPattern(
                                            classes.map(cl =>
                                              factory.createBindingElement(
                                                undefined,
                                                undefined,
                                                factory.createIdentifier(cl),
                                                undefined,
                                              ),
                                            ),
                                          ),
                                          factory.createObjectLiteralExpression([], false),
                                        ),
                                      ]),
                                ]),
                                undefined,
                                undefined,
                                factory.createIdentifier('props'),
                              ),
                            ],
                            ts.NodeFlags.Const,
                          ),
                        ),
                      ]
                    : []),
                  factory.createReturnStatement(returnedExpression),
                ],
                true,
              ),
            ),
          ]),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
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

export function mkClassAttr(classVarName: string, addClassOverride?: boolean) {
  const isRootClassName = classVarName === 'root';
  return factory.createJsxAttribute(
    factory.createIdentifier('className'),
    factory.createJsxExpression(
      undefined,
      !addClassOverride
        ? factory.createPropertyAccessExpression(
            factory.createIdentifier('classes'),
            factory.createIdentifier(classVarName),
          )
        : factory.createTemplateExpression(factory.createTemplateHead('', ''), [
            factory.createTemplateSpan(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('classes'),
                factory.createIdentifier(classVarName),
              ),
              factory.createTemplateMiddle(' ', ' '),
            ),
            factory.createTemplateSpan(
              factory.createBinaryExpression(
                flags.destructureClassNames
                  ? factory.createIdentifier(isRootClassName ? 'className' : classVarName)
                  : isRootClassName
                  ? factory.createPropertyAccessExpression(
                      factory.createIdentifier('props'),
                      factory.createIdentifier('className'),
                    )
                  : factory.createPropertyAccessChain(
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier('props'),
                        factory.createIdentifier('classes'),
                      ),
                      factory.createToken(ts.SyntaxKind.QuestionDotToken),
                      factory.createIdentifier(classVarName),
                    ),
                factory.createToken(ts.SyntaxKind.BarBarToken),
                factory.createStringLiteral(''),
              ),
              factory.createTemplateTail('', ''),
            ),
          ]),
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

export function mkNoReferrerAttr() {
  return factory.createJsxAttribute(factory.createIdentifier('rel'), factory.createStringLiteral('noreferrer'));
}

// If useful. Keep a couple of weeks and remove later.
// export function mkImg(srcVarName: string, extraAttributes: ts.JsxAttribute[]) {
//   return factory.createJsxSelfClosingElement(
//     factory.createIdentifier('img'),
//     undefined,
//     factory.createJsxAttributes([
//       factory.createJsxAttribute(
//         factory.createIdentifier('src'),
//         factory.createJsxExpression(undefined, factory.createIdentifier(srcVarName)),
//       ),
//       factory.createJsxAttribute(factory.createIdentifier('alt'), factory.createStringLiteral('')),
//       ...extraAttributes,
//     ]),
//   );
// }

export function mkSrcStaticAttribute(src: string) {
  return factory.createJsxAttribute(factory.createIdentifier('src'), factory.createStringLiteral(src));
}

export function mkComponentUsage(compName: string, extraAttributes?: ts.JsxAttribute[]) {
  return factory.createJsxSelfClosingElement(
    factory.createIdentifier(compName),
    undefined,
    factory.createJsxAttributes(extraAttributes || []),
  );
}

export function mkClassesAttribute(classes: Dict<string>) {
  const entries = Object.entries(classes);
  if (!entries.length) return undefined;
  return factory.createJsxAttribute(
    factory.createIdentifier('classes'),
    factory.createJsxExpression(
      undefined,
      factory.createObjectLiteralExpression(
        entries.map(([name, className]) =>
          factory.createPropertyAssignment(
            factory.createIdentifier(name),
            factory.createPropertyAccessExpression(
              factory.createIdentifier('classes'),
              factory.createIdentifier(className),
            ),
          ),
        ),
        false,
      ),
    ),
  );
}
