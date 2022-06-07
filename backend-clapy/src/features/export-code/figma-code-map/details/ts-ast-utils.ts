import { DeclarationPlain, RulePlain } from 'css-tree';
import ts, { Statement } from 'typescript';

import { mapTagStyles, mapTextStyles, postMapStyles } from '../../6-figma-to-code-map';
import { flags } from '../../../../env-and-config/app-config';
import { Dict, SceneNodeNoMethod } from '../../../sb-serialize-preview/sb-serialize.model';
import {
  CompContext,
  InstanceContext,
  JsxOneOrMore,
  ModuleContext,
  NodeContext,
  ProjectContext,
} from '../../code.model';
import { isComponentSet, SceneNode2, TextNode2 } from '../../create-ts-compiler/canvas-utils';
import {
  mkBlockCss,
  mkClassSelectorCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
} from '../../css-gen/css-factories-low';
import { stylesToList } from '../../css-gen/css-type-utils';
import { warnNode } from './utils-and-reset';

const { factory } = ts;

export function addCssRule(context: NodeContext, className: string, styles: DeclarationPlain[] = []) {
  const isInstanceContext = !!(context as InstanceContext).instanceNode;
  const increaseSpecificity = isInstanceContext;
  const classSelector = mkClassSelectorCss(className);
  const { cssRules } = context.moduleContext;
  const cssRule = mkRuleCss(
    mkSelectorListCss([mkSelectorCss(increaseSpecificity ? [classSelector, classSelector] : [classSelector])]),
    mkBlockCss(styles),
  );
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

export function getOrGenClassName(
  moduleContext: ModuleContext,
  node?: SceneNode2,
  defaultClassName = 'label',
  context?: InstanceContext,
): string {
  if (node?.className) {
    return node.className;
  }
  const isRootInComponent = node === moduleContext.node;
  if (context) {
    const { instanceNode, nodeOfComp, componentContext } = context;
    const { instanceClassesForStyles } = getOrCreateCompContext(instanceNode);
    const compClassName = getOrGenClassName(componentContext, nodeOfComp);
    if (instanceClassesForStyles[compClassName]) {
      if (!isRootInComponent) {
        // Beware, the below code is also run for instance overrides and text classes (6-figma-to-code-mapa.ts),
        // which might be undesired. To review with test cases.
        moduleContext.classes.add(instanceClassesForStyles[compClassName]);
      }
      return instanceClassesForStyles[compClassName];
    }
  }
  // No node when working on text segments. But can we find better class names than 'label' for this case?
  let baseName = isRootInComponent ? 'root' : node?.name ? node.name : defaultClassName;
  if (baseName === 'root' && !node) {
    baseName = 'subRoot';
  }
  const className = genUniqueName(moduleContext.classNamesAlreadyUsed, baseName);
  if (node && !node.className) {
    node.className = className;
    if (!isRootInComponent) {
      // Beware, the below code is also run for instance overrides and text classes (6-figma-to-code-mapa.ts),
      // which might be undesired. To review with test cases.
      moduleContext.classes.add(className);
    }
  } else if (!node && !moduleContext.classes.has(className)) {
    // For style overrides, prop names are generated, not bound to a node, but they are still exposed
    // in prop.classes.generatedClassName, so they need to be in the interface.
    moduleContext.classes.add(className);
  }
  return className;
}

export function getOrGenSwapName(componentContext: ModuleContext, node?: SceneNode2, swapBaseName?: string) {
  if (node?.swapName) {
    return node.swapName;
  }
  if (!node?.name && !swapBaseName) {
    throw new Error(
      `Either a node with a name or a swapBaseName is required to generate a swapName on module ${componentContext.compName}`,
    );
  }
  const swapName = genUniqueName(componentContext.swappableInstances, node?.name || swapBaseName!);
  if (node) {
    node.swapName = swapName;
  }
  return swapName;
}

export function getOrGenHideProp(
  componentContext: ModuleContext,
  node?: SceneNode2,
  hideBaseName?: string,
  skipPersist?: boolean,
) {
  if (node?.hideProp) {
    return node.hideProp;
  }
  if (!node?.name && !hideBaseName) {
    throw new Error(
      `Either a node with a name or a hideBaseName is required to generate a hideProp on module ${componentContext.compName}`,
    );
  }
  const hideProp = genUniqueName(componentContext.hideProps, node?.name || hideBaseName!);
  if (node && !skipPersist) {
    node.hideProp = hideProp;
  }
  return hideProp;
}

export function getOrGenTextOverrideProp(
  componentContext: ModuleContext,
  node?: SceneNode2,
  textOverrideBaseName?: string,
) {
  if (node?.textOverrideProp) {
    return node.textOverrideProp;
  }
  if (!node?.name && !textOverrideBaseName) {
    throw new Error(
      `Either a node with a name or a textOverrideBaseName is required to generate a textOverrideProp on module ${componentContext.compName}`,
    );
  }
  const textOverrideProp = genUniqueName(componentContext.textOverrideProps, node?.name || textOverrideBaseName!);
  if (node) {
    node.textOverrideProp = textOverrideProp;
  }
  return textOverrideProp;
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

export function getComponentName(projectContext: ProjectContext, node: SceneNode2) {
  const name = isComponentSet(node.parent) ? `${node.parent.name}_${node.name}` : node.name;
  return genUniqueName(projectContext.compNamesAlreadyUsed, name, true);
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

export function getOrCreateCompContext(node: SceneNode2) {
  if (!node) throw new Error('Calling getOrCreateCompContext on an undefined node.');
  if (!node._context) {
    node._context = {
      instanceClassesForStyles: {},
      instanceClassesForProps: {},
      instanceHidings: {},
      instanceSwaps: {},
      instanceTextOverrides: {},
    };
  }
  return node._context;
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

export function createComponentUsageWithAttributes(
  compContext: CompContext,
  componentModuleContext: ModuleContext,
  node: SceneNode2,
) {
  const { instanceSwaps, instanceHidings, instanceClassesForStyles, instanceTextOverrides } = compContext;
  const { root, ...otherInstanceClasses } = instanceClassesForStyles;
  if (!root) {
    warnNode(node, 'No root class found in instanceClasses.');
  }

  const attrs = [];

  const classAttr = mkClassAttr(root as string | undefined, true);
  if (classAttr) attrs.push(classAttr);

  const classesAttr = mkClassesAttribute(otherInstanceClasses);
  if (classesAttr) attrs.push(classesAttr);

  const swapAttr = mkSwapsAttribute(instanceSwaps);
  if (swapAttr) attrs.push(swapAttr);

  const hideAttr = mkHidingsAttribute(instanceHidings);
  if (hideAttr) attrs.push(hideAttr);

  const textOverrideAttr = mkTextOverridesAttribute(instanceTextOverrides);
  if (textOverrideAttr) attrs.push(textOverrideAttr);

  return mkComponentUsage(componentModuleContext.compName, attrs);
}

export function createTextAst(context: NodeContext, node: TextNode2, styles: Dict<DeclarationPlain>) {
  const { moduleContext } = context;

  // Add text styles
  let ast: JsxOneOrMore | undefined = mapTextStyles(context, node, styles);
  if (!ast) {
    warnNode(node, 'No text segments found in node. Cannot generate the HTML tag.');
    return;
  }

  const flexStyles: Dict<DeclarationPlain> = {};
  mapTagStyles(context, node, flexStyles);

  if (!context.parentStyles || Object.keys(flexStyles).length) {
    Object.assign(styles, flexStyles);
    styles = postMapStyles(context, node, styles);
    const className = getOrGenClassName(moduleContext, node);
    const styleDeclarations = stylesToList(styles);
    let attributes: ts.JsxAttribute[] = [];
    if (styleDeclarations.length) {
      addCssRule(context, className, styleDeclarations);
      attributes.push(mkClassAttr(className, true));
    }
    ast = mkTag('div', attributes, Array.isArray(ast) ? ast : [ast]);
  } else {
    styles = postMapStyles(context, node, styles);
    Object.assign(context.parentStyles, styles);
    // Later, here, we can add the code that will handle conflicts between parent node and child text nodes,
    // i.e. if the text node has different (and conflicting) styles with the parent (that potentially still need its style to apply to itself and/or siblings of the text node), then add an intermediate DOM node and apply the text style on it.

    // return txt;
  }
  return ast;
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

export function mkPropInterface(moduleContext: ModuleContext, classes: string[]) {
  const { swappableInstances, hideProps, textOverrideProps } = moduleContext;
  const swapPropNames = Array.from(swappableInstances);
  const hidePropNames = Array.from(hideProps);
  const textOverridePropNames = Array.from(textOverrideProps);
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
      ...(!swapPropNames?.length
        ? []
        : [
            factory.createPropertySignature(
              undefined,
              factory.createIdentifier('swap'),
              factory.createToken(ts.SyntaxKind.QuestionToken),
              factory.createTypeLiteralNode(
                swapPropNames.map(name =>
                  factory.createPropertySignature(
                    undefined,
                    factory.createIdentifier(name),
                    factory.createToken(ts.SyntaxKind.QuestionToken),
                    factory.createTypeReferenceNode(factory.createIdentifier('ReactNode'), undefined),
                  ),
                ),
              ),
            ),
          ]),
      ...(!hidePropNames?.length
        ? []
        : [
            factory.createPropertySignature(
              undefined,
              factory.createIdentifier('hide'),
              factory.createToken(ts.SyntaxKind.QuestionToken),
              factory.createTypeLiteralNode(
                hidePropNames.map(name =>
                  factory.createPropertySignature(
                    undefined,
                    factory.createIdentifier(name),
                    factory.createToken(ts.SyntaxKind.QuestionToken),
                    factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
                  ),
                ),
              ),
            ),
          ]),
      ...(!textOverridePropNames?.length
        ? []
        : [
            factory.createPropertySignature(
              undefined,
              factory.createIdentifier('text'),
              factory.createToken(ts.SyntaxKind.QuestionToken),
              factory.createTypeLiteralNode(
                textOverridePropNames.map(name =>
                  factory.createPropertySignature(
                    undefined,
                    factory.createIdentifier(name),
                    factory.createToken(ts.SyntaxKind.QuestionToken),
                    factory.createTypeReferenceNode(factory.createIdentifier('ReactNode'), undefined),
                  ),
                ),
              ),
            ),
          ]),
    ],
  );
}

function jsxOneOrMoreToJsxExpression(
  tsx: JsxOneOrMore | ts.ConditionalExpression | ts.ParenthesizedExpression | undefined,
) {
  if (tsx) {
    if (Array.isArray(tsx)) {
      return mkFragment(tsx);
    } else if (ts.isJsxText(tsx)) {
      return mkFragment([tsx]);
    } else {
      return tsx;
    }
  } else {
    return ts.factory.createNull();
  }
}

export function mkCompFunction(
  fnName: string,
  classes: string[],
  tsx: JsxOneOrMore | undefined,
  prefixStatements: Statement[] = [],
) {
  let returnedExpression = jsxOneOrMoreToJsxExpression(tsx);

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

function mkWrapExpressionFragment(node: JsxOneOrMore | ts.ParenthesizedExpression | ts.ConditionalExpression) {
  if (!Array.isArray(node) && (ts.isParenthesizedExpression(node) || ts.isConditionalExpression(node))) {
    return factory.createJsxExpression(undefined, node);
  }
  return node;
}

export function mkFragment(children: ts.JsxChild | ts.JsxChild[]) {
  if (!Array.isArray(children)) {
    children = [children];
  }
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

export function mkClassAttr<T extends string | undefined>(
  classVarName: T,
  addClassOverride?: boolean,
): T extends string ? ts.JsxAttribute : undefined {
  if (!classVarName) return undefined as T extends string ? ts.JsxAttribute : undefined;
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
  ) as T extends string ? ts.JsxAttribute : undefined;
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

export function mkSwapInstanceAndHideWrapper(
  context: NodeContext,
  swapName: string,
  compAst: ts.JsxSelfClosingElement,
  node: SceneNode2,
) {
  const astAndSwapExpr = factory.createBinaryExpression(
    factory.createPropertyAccessChain(
      factory.createPropertyAccessExpression(factory.createIdentifier('props'), factory.createIdentifier('swap')),
      factory.createToken(ts.SyntaxKind.QuestionDotToken),
      factory.createIdentifier(swapName),
    ),
    factory.createToken(ts.SyntaxKind.BarBarToken),
    compAst,
  );

  const ast = node.hideProp
    ? factory.createJsxExpression(
        undefined,
        factory.createBinaryExpression(
          factory.createPrefixUnaryExpression(
            ts.SyntaxKind.ExclamationToken,
            factory.createPropertyAccessChain(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('props'),
                factory.createIdentifier('hide'),
              ),
              factory.createToken(ts.SyntaxKind.QuestionDotToken),
              factory.createIdentifier(node.hideProp),
            ),
          ),
          factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
          factory.createParenthesizedExpression(astAndSwapExpr),
        ),
      )
    : factory.createJsxExpression(undefined, astAndSwapExpr);

  return context.isRootInComponent ? mkFragment([ast]) : ast;
}

function mkWrapTextOverrideExprFragment(ast: JsxOneOrMore, node: SceneNode2) {
  if (!node.textOverrideProp) {
    return ast;
  }
  return factory.createConditionalExpression(
    factory.createBinaryExpression(
      factory.createPropertyAccessChain(
        factory.createPropertyAccessExpression(factory.createIdentifier('props'), factory.createIdentifier('text')),
        factory.createToken(ts.SyntaxKind.QuestionDotToken),
        factory.createIdentifier(node.textOverrideProp),
      ),
      factory.createToken(ts.SyntaxKind.ExclamationEqualsToken),
      factory.createNull(),
    ),
    factory.createToken(ts.SyntaxKind.QuestionToken),
    factory.createPropertyAccessChain(
      factory.createPropertyAccessExpression(factory.createIdentifier('props'), factory.createIdentifier('text')),
      factory.createToken(ts.SyntaxKind.QuestionDotToken),
      factory.createIdentifier(node.textOverrideProp),
    ),
    factory.createToken(ts.SyntaxKind.ColonToken),
    jsxOneOrMoreToJsxExpression(ast),
  );
}

function mkWrapHideExprFragment(ast: JsxOneOrMore | ts.ConditionalExpression, node: SceneNode2) {
  if (!node.hideProp) {
    return ast;
  }
  return factory.createJsxExpression(
    undefined,
    factory.createBinaryExpression(
      factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        factory.createPropertyAccessChain(
          factory.createPropertyAccessExpression(factory.createIdentifier('props'), factory.createIdentifier('hide')),
          factory.createToken(ts.SyntaxKind.QuestionDotToken),
          factory.createIdentifier(node.hideProp),
        ),
      ),
      factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
      jsxOneOrMoreToJsxExpression(ast),
    ),
  );
}

export function mkWrapHideAndTextOverrideAst(context: NodeContext, ast: JsxOneOrMore, node: SceneNode2) {
  const astTmp = mkWrapTextOverrideExprFragment(ast, node);
  const ast2 = mkWrapHideExprFragment(astTmp, node);
  if (ast === ast2) return ast;
  const ast3: JsxOneOrMore = mkWrapExpressionFragment(ast2);
  return context.isRootInComponent ? mkFragment(ast3) : ast3;
}

export function mkClassesAttribute(classes: Dict<string>) {
  const addClassOverride = true;
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

            !addClassOverride
              ? factory.createPropertyAccessExpression(
                  factory.createIdentifier('classes'),
                  factory.createIdentifier(className),
                )
              : factory.createTemplateExpression(factory.createTemplateHead('', ''), [
                  factory.createTemplateSpan(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('classes'),
                      factory.createIdentifier(className),
                    ),
                    factory.createTemplateMiddle(' ', ' '),
                  ),
                  factory.createTemplateSpan(
                    factory.createBinaryExpression(
                      flags.destructureClassNames
                        ? factory.createIdentifier(className)
                        : factory.createPropertyAccessChain(
                            factory.createPropertyAccessExpression(
                              factory.createIdentifier('props'),
                              factory.createIdentifier('classes'),
                            ),
                            factory.createToken(ts.SyntaxKind.QuestionDotToken),
                            factory.createIdentifier(className),
                          ),
                      factory.createToken(ts.SyntaxKind.BarBarToken),
                      factory.createStringLiteral(''),
                    ),
                    factory.createTemplateTail('', ''),
                  ),
                ]),
          ),
        ),
        false,
      ),
    ),
  );
}

export function mkSwapsAttribute(swaps: CompContext['instanceSwaps']) {
  const entries = Object.entries(swaps).filter(([_, swapValue]) => swapValue !== false);
  if (!entries.length) return undefined;
  return factory.createJsxAttribute(
    factory.createIdentifier('swap'),
    factory.createJsxExpression(
      undefined,
      factory.createObjectLiteralExpression(
        entries.map(([name, swapValue]) => {
          if (swapValue === false) {
            throw new Error('[mkSwapsAttribute] false value should have been filtered before.');
          }
          return factory.createPropertyAssignment(
            factory.createIdentifier(name),
            typeof swapValue === 'string'
              ? factory.createPropertyAccessChain(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('props'),
                    factory.createIdentifier('swap'),
                  ),
                  factory.createToken(ts.SyntaxKind.QuestionDotToken),
                  factory.createIdentifier(swapValue),
                )
              : swapValue,
          );
        }),
        true,
      ),
    ),
  );
}

export function mkHidingsAttribute(hidings: CompContext['instanceHidings']) {
  // Possible improvements: default values are not managed, although it could. But for that, we need to first ensure the parent component passes well the hide value for the grandchild instance, then the intermediate component, mapping hide to its props, can apply a default value.
  // The generated code could look like:
  //    hide={{
  //      btnTxt: props.hide?.btnTxt != null ? props.hide?.btnTxt : [defaultValue, true or false],
  //    }}
  // Even better (later?), we could add the notion of default values in the component props directly.
  const entries = Object.entries(hidings).filter(([_, hideValue]) => hideValue !== false);
  if (!entries.length) return undefined;
  return factory.createJsxAttribute(
    factory.createIdentifier('hide'),
    factory.createJsxExpression(
      undefined,
      factory.createObjectLiteralExpression(
        entries.map(([name, hideValue]) => {
          if (hideValue === false) {
            throw new Error('[mkHidingsAttribute] false value should have been filtered before.');
          }
          return factory.createPropertyAssignment(
            factory.createIdentifier(name),
            hideValue === true
              ? factory.createTrue()
              : factory.createPropertyAccessChain(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('props'),
                    factory.createIdentifier('hide'),
                  ),
                  factory.createToken(ts.SyntaxKind.QuestionDotToken),
                  factory.createIdentifier(hideValue),
                ),
          );
        }),
        true,
      ),
    ),
  );
}

export function mkTextOverridesAttribute(textOverrides: CompContext['instanceTextOverrides']) {
  // Possible improvements: default values (cf other overrides like hidings)
  const entries = Object.entries(textOverrides).filter(([_, textOverrideValue]) => textOverrideValue !== false);
  if (!entries.length) return undefined;
  return factory.createJsxAttribute(
    factory.createIdentifier('text'),
    factory.createJsxExpression(
      undefined,
      factory.createObjectLiteralExpression(
        entries.map(([name, textOverrideValue]) => {
          if (textOverrideValue === false) {
            throw new Error('[mkTextOverridesAttribute] false value should have been filtered before.');
          }
          return factory.createPropertyAssignment(
            factory.createIdentifier(name),
            typeof textOverrideValue === 'string'
              ? factory.createPropertyAccessChain(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('props'),
                    factory.createIdentifier('text'),
                  ),
                  factory.createToken(ts.SyntaxKind.QuestionDotToken),
                  factory.createIdentifier(textOverrideValue),
                )
              : jsxOneOrMoreToJsxExpression(textOverrideValue),
          );
        }),
        true,
      ),
    ),
  );
}
