import { ts } from 'ts-morph';

import { SceneNodeNoMethod } from '../../sb-serialize-preview/sb-serialize.model';
import {
  mkBlockCss,
  mkClassSelectorCss,
  mkDeclarationCss,
  mkIdentifierCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
  mkStylesheetCss,
  mkValueCss,
} from '../css-gen/css-factories';

const { factory } = ts;
const classImport = 'classes';

export async function figmaToAst(node: SceneNodeNoMethod) /* : ts.Node */ {
  // await wait(2000);
  // return mkJsxElement();

  const cssAst = mkStylesheetCss([
    mkRuleCss(
      mkSelectorListCss([mkSelectorCss([mkClassSelectorCss('root')])]),
      mkBlockCss([mkDeclarationCss('display', mkValueCss([mkIdentifierCss('flex')]))]),
    ),
  ]);
  // console.log(cssAst);

  const tagName = guessTagName(node);
  const classAttr = mkClassAttr('root');
  const children: ts.JsxChild[] = [factory.createJsxText('Sign up', false)];
  const tsx = mkTag(tagName, [classAttr], children);
  return [tsx, cssAst] as const;
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

function guessTagName(node: SceneNodeNoMethod) {
  const name = node.name.toLowerCase();
  if (name === 'button' || (name.includes('button') && !name.includes('wrapper'))) {
    return 'button';
  }
  return 'div';
}

function mkNull() {
  const { factory } = ts;
  return factory.createNull();
}

function mkButtonExample() {
  const { factory } = ts;

  return factory.createJsxElement(
    factory.createJsxOpeningElement(
      factory.createIdentifier('button'),
      undefined,
      factory.createJsxAttributes([
        factory.createJsxAttribute(
          factory.createIdentifier('className'),
          factory.createJsxExpression(
            undefined,
            factory.createPropertyAccessExpression(
              factory.createIdentifier('classes'),
              factory.createIdentifier('root'),
            ),
          ),
        ),
      ]),
    ),
    [
      factory.createJsxText('\
        ', true),
      factory.createJsxElement(
        factory.createJsxOpeningElement(
          factory.createIdentifier('div'),
          undefined,
          factory.createJsxAttributes([
            factory.createJsxAttribute(
              factory.createIdentifier('className'),
              factory.createJsxExpression(
                undefined,
                factory.createPropertyAccessExpression(
                  factory.createIdentifier('classes'),
                  factory.createIdentifier('buttonBase'),
                ),
              ),
            ),
          ]),
        ),
        [factory.createJsxText('Sign up', false)],
        factory.createJsxClosingElement(factory.createIdentifier('div')),
      ),
      factory.createJsxText('\
      ', true),
    ],
    factory.createJsxClosingElement(factory.createIdentifier('button')),
  );
}

// Use https://ts-ast-viewer.com/ to quickly generate examples
function mkJsxElement() {
  const { factory } = ts;

  return factory.createJsxElement(
    factory.createJsxOpeningElement(
      factory.createIdentifier('div'),
      undefined,
      factory.createJsxAttributes([
        factory.createJsxAttribute(
          factory.createIdentifier('className'),
          factory.createJsxExpression(
            undefined,
            factory.createPropertyAccessExpression(
              factory.createIdentifier('classes'),
              factory.createIdentifier('root'),
            ),
          ),
        ),
      ]),
    ),
    [
      factory.createJsxElement(
        factory.createJsxOpeningElement(factory.createIdentifier('span'), undefined, factory.createJsxAttributes([])),
        [factory.createJsxText('Template', false)],
        factory.createJsxClosingElement(factory.createIdentifier('span')),
      ),
    ],
    factory.createJsxClosingElement(factory.createIdentifier('div')),
  );
}
