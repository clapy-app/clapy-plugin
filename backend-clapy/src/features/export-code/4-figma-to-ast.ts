import { ts } from 'ts-morph';

import { SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';

export function figmaToAst(figmaNode: SceneNodeNoMethod): ts.Node {
  console.log(Object.keys(figmaNode).length);
  return mkJsxElement();
}

function mkNull() {
  const { factory } = ts;
  return factory.createNull();
}

// Use https://ts-ast-viewer.com/ to quickly generate examples
function mkJsxElement() {
  const { factory } = ts;

  const jsxElt = factory.createJsxElement(
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

  return jsxElt;
}
