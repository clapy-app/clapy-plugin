import type { DeclarationPlain, RulePlain } from 'css-tree';
import type { Statement } from 'typescript';
import ts from 'typescript';

import { flags } from '../../../env-and-config/app-config.js';
import { env } from '../../../env-and-config/env.js';
import { warnOrThrow } from '../../../utils.js';
import type { SceneNodeNoMethod } from '../../sb-serialize-preview/sb-serialize.model.js';
import type {
  BaseStyleOverride,
  CompContext,
  FigmaOverride,
  JsxOneOrMore,
  ModuleContext,
  NodeContext,
  StyleOverride,
} from '../code.model.js';
import type { RulePlainExtended, SceneNode2 } from '../create-ts-compiler/canvas-utils.js';
import { isInstance } from '../create-ts-compiler/canvas-utils.js';
import { mkSelectorsWithBem, shouldIncreaseSpecificity } from '../css-gen/css-factories-high.js';
import {
  cssAstToString,
  mkBlockCss,
  mkRawCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
} from '../css-gen/css-factories-low.js';
import { useBem } from './process-nodes-utils.js';
import { warnNode } from './utils-and-reset.js';

const { factory } = ts;

export function addCssRule(
  context: NodeContext,
  className: string | false,
  styleDeclarations: DeclarationPlain[],
  node: SceneNode2,
  skipAssignRule?: boolean,
) {
  const bem = useBem(context);
  const increaseSpecificity = shouldIncreaseSpecificity(context);

  const { cssRules } = context.moduleContext;
  const selectors = mkSelectorsWithBem(context, className, node.rule);
  const block = mkBlockCss(styleDeclarations);
  let cssRule: RulePlain;
  if (bem && increaseSpecificity && className) {
    // Doubled selector for specificity with scss: https://stackoverflow.com/a/47781599/4053349
    const sel = mkSelectorListCss([mkSelectorCss([mkRawCss('&#{&}')])]);
    const ruleAsStr = cssAstToString(mkRuleCss(sel, block));
    cssRule = mkRuleCss(selectors, mkBlockCss([mkRawCss(ruleAsStr)]));
  } else {
    cssRule = mkRuleCss(selectors, block);
  }
  const parentRule = node.rule;
  if (bem && parentRule) {
    bindRuleToParent(parentRule, cssRule);
  } else {
    cssRules.push(cssRule);
  }
  if (bem && !skipAssignRule) {
    node.rule = cssRule;
  }
  return cssRule;
}

export function bindRuleToParent(parentRule: RulePlainExtended, cssRule: RulePlain) {
  if (!parentRule.childRules) parentRule.childRules = [];
  parentRule.childRules.push(cssRule);
  // If the tree should be the other way around (link to parent instead of children):
  (cssRule as RulePlainExtended).parentRule = parentRule;
}

export function updateCssRule(
  context: NodeContext,
  cssRule: RulePlain,
  className: string,
  parentRule: RulePlainExtended | undefined,
  styleDeclarations: DeclarationPlain[],
) {
  const bem = useBem(context);
  const increaseSpecificity = shouldIncreaseSpecificity(context);

  cssRule.prelude = mkSelectorsWithBem(context, className, parentRule);
  context.selector = cssAstToString(cssRule.prelude);

  if (bem && increaseSpecificity) {
    // Doubled selector for specificity with scss: https://stackoverflow.com/a/47781599/4053349
    const sel = mkSelectorListCss([mkSelectorCss([mkRawCss('&#{&}')])]);
    const block = mkBlockCss(styleDeclarations);
    const ruleAsStr = cssAstToString(mkRuleCss(sel, block));
    cssRule.block.children.push(mkRawCss(ruleAsStr));
  } else {
    cssRule.block.children.push(...styleDeclarations);
  }
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

export function fillIsRootInComponent(moduleContext: ModuleContext, node: SceneNode2) {
  // It may be equivalent to `isComponent(node)`, but for safety, I keep the legacy test. We can refactor later, and test when the app is stable.
  node.isRootInComponent = node === moduleContext.node;
}

export function mkHtmlFullClass(context: NodeContext, className: string, parentClassName?: string) {
  // If following the BEM conventions, the HTML class name includes the parent class name.
  // So mkHtmlFullClass needs to be called in the right order, from parent to child.
  const bem = useBem(context);
  return bem && parentClassName ? `${parentClassName}__${className || ''}` : className || '';
}

export function getOrCreateCompContext(node: SceneNode2) {
  if (!node) throw new Error('Calling getOrCreateCompContext on an undefined node.');
  if (!node._context) {
    node._context = {
      instanceStyleOverrides: {},
      instanceHidings: {},
      instanceSwaps: {},
      instanceTextOverrides: {},
    };
  }
  return node._context;
}

export function checkIsOriginalInstance(node: SceneNode2, nextNode: SceneNode2 | undefined) {
  if (!node) {
    throw new Error(`BUG [checkIsOriginalInstance] node is undefined.`);
  }
  if (!nextNode) {
    throw new Error(`BUG [checkIsOriginalInstance] nextNode is undefined.`);
  }
  const nodeIsInstance = isInstance(node);
  const nextNodeIsInstance = isInstance(nextNode);
  if (nodeIsInstance !== nextNodeIsInstance) {
    throw new Error(
      `BUG nodeIsInstance: ${nodeIsInstance} but nextNodeIsInstance: ${nextNodeIsInstance}, althought they are supposed to be the same.`,
    );
  }
  return !nodeIsInstance || !nextNodeIsInstance || node.mainComponent!.id === nextNode.mainComponent!.id; // = not swapped in Figma
}

export function createClassAttrForNode(node: SceneNode2, className?: string) {
  const className2 = className || node.className;
  const overrideEntry: BaseStyleOverride = {
    overrideValue: className2,
    propValue: node.classOverride ? node.className : undefined,
  };
  return mkClassAttr2(overrideEntry);
}

export function createClassAttrForClassNoOverride(className: string | undefined) {
  const overrideEntry: BaseStyleOverride = { overrideValue: className };
  return mkClassAttr2(overrideEntry);
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
  isTypeOnly?: boolean,
) {
  return factory.createImportDeclaration(
    undefined,
    undefined,
    factory.createImportClause(
      !!isTypeOnly,
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

export function mkPropInterface(moduleContext: ModuleContext) {
  const { classOverrides, swaps, hideProps, textOverrideProps } = moduleContext;
  const classes = Array.from(classOverrides);
  const swapsArr = Array.from(swaps);
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
                classes.map(classOverride =>
                  factory.createPropertySignature(
                    undefined,
                    factory.createIdentifier(classOverride),
                    factory.createToken(ts.SyntaxKind.QuestionToken),
                    factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                  ),
                ),
              ),
            ),
          ]),
      ...(!swapsArr?.length
        ? []
        : [
            factory.createPropertySignature(
              undefined,
              factory.createIdentifier('swap'),
              factory.createToken(ts.SyntaxKind.QuestionToken),
              factory.createTypeLiteralNode(
                swapsArr.map(swap =>
                  factory.createPropertySignature(
                    undefined,
                    factory.createIdentifier(swap),
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

function jsxOneOrMoreToJsxExpression(tsx: JsxOneOrMore | ts.Expression | undefined) {
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
  moduleContext: ModuleContext,
  fnName: string,
  tsx: JsxOneOrMore | undefined,
  prefixStatements: Statement[] = [],
  skipAnnotation?: boolean,
) {
  const { classOverrides } = moduleContext;
  const classes = Array.from(classOverrides);
  let returnedExpression = jsxOneOrMoreToJsxExpression(tsx);

  // Create the component function as AST node
  const componentVariableStatement = factory.createVariableStatement(
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

  if (!skipAnnotation) {
    // Attach an annotation with Figma ID.
    // Ideally, it should be TSDoc (/ JSDoc), but it is not supported by the ts compiler API.
    // As a workaround, we use multi-line comments.
    // https://stackoverflow.com/a/57206925/4053349
    // https://github.com/microsoft/TypeScript/issues/17146
    ts.addSyntheticLeadingComment(
      componentVariableStatement,
      ts.SyntaxKind.MultiLineCommentTrivia,
      ` @figmaId ${moduleContext.node.id} `,
      true,
    );
  }

  return componentVariableStatement;
}

function mkWrapExpressionFragment(
  node: JsxOneOrMore | ts.ParenthesizedExpression | ts.ConditionalExpression | ts.BinaryExpression,
) {
  if (
    !Array.isArray(node) &&
    (ts.isParenthesizedExpression(node) || ts.isConditionalExpression(node) || ts.isBinaryExpression(node))
  ) {
    return factory.createJsxExpression(undefined, node);
  }
  return node;
}

function jsxOneOrMoreToExpression(ast: ts.Expression | JsxOneOrMore | undefined) {
  if (ast && (Array.isArray(ast) || ts.isJsxText(ast))) {
    return mkFragment(ast);
  }
  return ast;
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

export function mkInputTypeAttr(value = 'checkbox') {
  return mkStringAttr('type', value);
}

export function mkHrefAttr(url: string) {
  return mkStringAttr('href', url);
}

export function mkTargetBlankAttr() {
  return mkStringAttr('target', '_blank');
}

export function mkNoReferrerAttr() {
  return mkStringAttr('rel', 'noreferrer');
}

export function mkStringAttr(attributeName: string, value: string) {
  return factory.createJsxAttribute(factory.createIdentifier(attributeName), factory.createStringLiteral(value));
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

export function mkIdAttribute(id: string) {
  return factory.createJsxAttribute(factory.createIdentifier('id'), factory.createStringLiteral(id));
}

export function mkSwapInstanceAlone(context: NodeContext, compAst: ts.JsxSelfClosingElement, node: SceneNode2) {
  let ast: ts.JsxSelfClosingElement | ts.Expression = compAst;
  let ast2: ts.JsxSelfClosingElement | ts.JsxExpression = compAst;
  if (node.swapName) {
    ast = factory.createBinaryExpression(
      factory.createPropertyAccessChain(
        factory.createPropertyAccessExpression(factory.createIdentifier('props'), factory.createIdentifier('swap')),
        factory.createToken(ts.SyntaxKind.QuestionDotToken),
        factory.createIdentifier(node.swapName),
      ),
      factory.createToken(ts.SyntaxKind.BarBarToken),
      jsxOneOrMoreToExpression(ast)!,
    );
    ast2 = factory.createJsxExpression(undefined, jsxOneOrMoreToExpression(ast)!);
  }
  return context.isRootInComponent ? mkFragment(ast2) : ast2;
}

export function mkSwapInstanceAndHideWrapper(
  context: NodeContext,
  compAst: ts.JsxSelfClosingElement | undefined,
  node: SceneNode2,
) {
  let ast: ts.JsxSelfClosingElement | ts.Expression | undefined = compAst;
  let ast2: ts.JsxSelfClosingElement | ts.JsxExpression | undefined = compAst;
  if (node.swapName) {
    const expr = jsxOneOrMoreToExpression(ast);
    ast = factory.createBinaryExpression(
      factory.createPropertyAccessChain(
        factory.createPropertyAccessExpression(factory.createIdentifier('props'), factory.createIdentifier('swap')),
        factory.createToken(ts.SyntaxKind.QuestionDotToken),
        factory.createIdentifier(node.swapName),
      ),
      factory.createToken(ts.SyntaxKind.BarBarToken),
      expr || factory.createNull(),
    );
  }
  ast = mkWrapHideExprFragment(ast, node);
  if (!ast) return;
  if (node.swapName || node.hideProp) {
    ast2 = factory.createJsxExpression(undefined, jsxOneOrMoreToExpression(ast)!);
  }
  return context.isRootInComponent && ast2 ? mkFragment(ast2) : ast2;
}

function mkWrapTextOverrideExprFragment(ast: JsxOneOrMore | undefined, node: SceneNode2) {
  if (!ast || !node.textOverrideProp) {
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

function mkWrapHideExprFragment<T extends JsxOneOrMore | ts.Expression | undefined>(ast: T, node: SceneNode2) {
  if (!node.hideProp) {
    return ast;
  }
  if (node.hideDefaultValue == null) {
    warnOrThrow(`Node ${node.name} is missing hideOverrideValue although it has a hideProp.`);
    node.hideDefaultValue = true;
  }
  const hidePropVar = factory.createPropertyAccessChain(
    factory.createPropertyAccessExpression(factory.createIdentifier('props'), factory.createIdentifier('hide')),
    factory.createToken(ts.SyntaxKind.QuestionDotToken),
    factory.createIdentifier(node.hideProp),
  );
  const checkHideExpr =
    node.hideDefaultValue === true
      ? factory.createBinaryExpression(
          hidePropVar,
          factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
          factory.createFalse(),
        )
      : factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, hidePropVar);
  const ast2 = factory.createBinaryExpression(
    checkHideExpr,
    factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
    jsxOneOrMoreToJsxExpression(ast),
  );
  return ast2;
}

export function mkWrapHideAndTextOverrideAst(context: NodeContext, ast: JsxOneOrMore | undefined, node: SceneNode2) {
  const astTmp = mkWrapTextOverrideExprFragment(ast, node);
  const ast2 = mkWrapHideExprFragment(astTmp, node);
  if (!ast2) return;
  if (ast === ast2) return ast;
  const ast3: JsxOneOrMore = mkWrapExpressionFragment(ast2);
  return context.isRootInComponent ? mkFragment(ast3) : ast3;
}

export function mkClassAttr2<T extends BaseStyleOverride | undefined>(
  overrideEntry: T,
): T extends BaseStyleOverride ? ts.JsxAttribute : undefined {
  if (!overrideEntry) return undefined as T extends BaseStyleOverride ? ts.JsxAttribute : undefined;
  const classExpr = mkClassExpression(overrideEntry);
  if (!classExpr) {
    return undefined as T extends BaseStyleOverride ? ts.JsxAttribute : undefined;
  }

  return factory.createJsxAttribute(
    factory.createIdentifier('className'),
    factory.createJsxExpression(undefined, classExpr),
  ) as T extends BaseStyleOverride ? ts.JsxAttribute : undefined;
}

export function mkClassAttr3(className: string) {
  return factory.createJsxAttribute(
    factory.createIdentifier('className'),
    factory.createJsxExpression(
      undefined,
      factory.createPropertyAccessExpression(factory.createIdentifier('classes'), factory.createIdentifier(className)),
    ),
  );
}

function mkClassExpression(overrideEntry: BaseStyleOverride) {
  const { overrideValue, propValue } = overrideEntry;
  if (!overrideValue && !propValue) {
    throw new Error(
      `[mkClassExpression] BUG Missing both overrideValue and propValue when writing overrides for node ${
        (overrideEntry as FigmaOverride<any>).intermediateNode?.name
      }, prop ${(overrideEntry as FigmaOverride<any>).propName}.`,
    );
  }
  const isRoot = overrideValue === 'root' || propValue === 'root';
  const readFromPropTemplateSpans: ts.TemplateSpan[] = [];
  if (propValue) {
    readFromPropTemplateSpans.push(
      factory.createTemplateSpan(
        factory.createBinaryExpression(
          factory.createPropertyAccessChain(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('props'),
              factory.createIdentifier('classes'),
            ),
            factory.createToken(ts.SyntaxKind.QuestionDotToken),
            factory.createIdentifier(propValue),
          ),
          factory.createToken(ts.SyntaxKind.BarBarToken),
          factory.createStringLiteral(''),
        ),
        isRoot ? factory.createTemplateMiddle(' ', ' ') : factory.createTemplateTail('', ''),
      ),
    );
    if (isRoot) {
      readFromPropTemplateSpans.push(
        factory.createTemplateSpan(
          factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('props'),
              factory.createIdentifier('className'),
            ),
            factory.createToken(ts.SyntaxKind.BarBarToken),
            factory.createStringLiteral(''),
          ),
          factory.createTemplateTail('', ''),
        ),
      );
    }
  }

  const readFromClasses = !overrideValue
    ? undefined
    : factory.createPropertyAccessExpression(
        factory.createIdentifier('classes'),
        factory.createIdentifier(overrideValue),
      );

  return !overrideValue
    ? factory.createTemplateExpression(factory.createTemplateHead('', ''), readFromPropTemplateSpans!)
    : !propValue
    ? readFromClasses!
    : factory.createTemplateExpression(factory.createTemplateHead('', ''), [
        factory.createTemplateSpan(readFromClasses!, factory.createTemplateMiddle(' ', ' ')),
        ...(!readFromPropTemplateSpans ? [] : readFromPropTemplateSpans),
      ]);
}

export function mkClassesAttribute2(moduleContext: ModuleContext, otherClassOverrides: StyleOverride[]) {
  const entries = Object.values(otherClassOverrides);
  if (!entries.length) return undefined;
  try {
    return factory.createJsxAttribute(
      factory.createIdentifier('classes'),
      factory.createJsxExpression(
        undefined,
        factory.createObjectLiteralExpression(
          entries.map(styleOverride => {
            const { propName } = styleOverride;
            const classExpr = mkClassExpression(styleOverride);
            if (!classExpr) {
              throw new Error('[mkClassesAttribute] Failed to generate classExpr, see logs.');
            }

            return factory.createPropertyAssignment(factory.createIdentifier(propName), classExpr);
          }),
          false,
        ),
      ),
    );
  } catch (error) {
    if (env.isDev) throw error;
    return undefined;
  }
}

// Those mk* overrides methods can be refactored. They share a common structure.
export function mkSwapsAttribute(swaps: CompContext['instanceSwaps']) {
  const swapsArr = Object.values(swaps);
  if (!swapsArr.length) return undefined;
  return factory.createJsxAttribute(
    factory.createIdentifier('swap'),
    factory.createJsxExpression(
      undefined,
      factory.createObjectLiteralExpression(
        swapsArr.map(overrideEntry => {
          const { propName, overrideValue, propValue } = overrideEntry;
          if (!overrideValue && !propValue) {
            throw new Error(
              `[mkSwapsAttribute] BUG Missing both overrideValue and propValue when writing overrides for node ${
                (overrideEntry as FigmaOverride<any>).intermediateNode?.name
              }, prop ${(overrideEntry as FigmaOverride<any>).propName}.`,
            );
            // overrideEntry may not be a FigmaOverride, but the base version only, so propName and intermediateNode are not guaranteed to exist. But if they do, they bring useful information for the error message.
          }

          const propExpr = propValue
            ? factory.createPropertyAccessChain(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier('props'),
                  factory.createIdentifier('swap'),
                ),
                factory.createToken(ts.SyntaxKind.QuestionDotToken),
                factory.createIdentifier(propValue),
              )
            : undefined;

          const overrideValueAst = jsxOneOrMoreToExpression(overrideValue);

          const ast = !propValue
            ? overrideValueAst!
            : !overrideValue
            ? propExpr!
            : factory.createBinaryExpression(
                propExpr!,
                factory.createToken(ts.SyntaxKind.BarBarToken),
                overrideValueAst!,
              );

          return factory.createPropertyAssignment(factory.createIdentifier(propName), ast);
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
  const entries = Object.values(hidings);
  if (!entries.length) return undefined;
  return factory.createJsxAttribute(
    factory.createIdentifier('hide'),
    factory.createJsxExpression(
      undefined,
      factory.createObjectLiteralExpression(
        entries.map(overrideEntry => {
          const { propName, overrideValue, propValue } = overrideEntry;
          if (overrideValue == null && propValue == null) {
            throw new Error(
              `[mkHidingsAttribute] BUG Missing both overrideValue and propValue when writing overrides for node ${
                (overrideEntry as FigmaOverride<any>).intermediateNode?.name
              }, prop ${(overrideEntry as FigmaOverride<any>).propName}.`,
            );
            // overrideEntry may not be a FigmaOverride, but the base version only, so propName and intermediateNode are not guaranteed to exist. But if they do, they bring useful information for the error message.
          }

          const propExpr = propValue
            ? factory.createPropertyAccessChain(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier('props'),
                  factory.createIdentifier('hide'),
                ),
                factory.createToken(ts.SyntaxKind.QuestionDotToken),
                factory.createIdentifier(propValue),
              )
            : undefined;

          const overrideValueAst =
            overrideValue == null ? undefined : overrideValue ? factory.createTrue() : factory.createFalse();

          const ast = !propValue
            ? overrideValueAst!
            : overrideValue == null
            ? propExpr!
            : factory.createBinaryExpression(
                propExpr!,
                factory.createToken(ts.SyntaxKind.BarBarToken),
                overrideValueAst!,
              );

          return factory.createPropertyAssignment(factory.createIdentifier(propName), ast);
        }),
        true,
      ),
    ),
  );
}

export function mkTextOverridesAttribute(textOverrides: CompContext['instanceTextOverrides']) {
  // Possible improvements: default values (cf other overrides like hidings)
  const entries = Object.values(textOverrides);
  if (!entries.length) return undefined;
  return factory.createJsxAttribute(
    factory.createIdentifier('text'),
    factory.createJsxExpression(
      undefined,
      factory.createObjectLiteralExpression(
        entries.map(overrideEntry => {
          const { propName, overrideValue, propValue } = overrideEntry;
          if (overrideValue == null && propValue == null) {
            throw new Error(
              `[mkTextOverridesAttribute] BUG Missing both overrideValue and propValue when writing overrides for node ${
                (overrideEntry as FigmaOverride<any>).intermediateNode?.name
              }, prop ${(overrideEntry as FigmaOverride<any>).propName}.`,
            );
            // overrideEntry may not be a FigmaOverride, but the base version only, so propName and intermediateNode are not guaranteed to exist. But if they do, they bring useful information for the error message.
          }

          const propExpr = propValue
            ? factory.createPropertyAccessChain(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier('props'),
                  factory.createIdentifier('text'),
                ),
                factory.createToken(ts.SyntaxKind.QuestionDotToken),
                factory.createIdentifier(propValue),
              )
            : undefined;

          const overrideValueAst = jsxOneOrMoreToJsxExpression(overrideValue);

          const ast = !propValue
            ? overrideValueAst!
            : overrideValue == null
            ? propExpr!
            : factory.createBinaryExpression(
                propExpr!,
                factory.createToken(ts.SyntaxKind.BarBarToken),
                overrideValueAst!,
              );

          return factory.createPropertyAssignment(factory.createIdentifier(propName), ast);
        }),
        true,
      ),
    ),
  );
}
