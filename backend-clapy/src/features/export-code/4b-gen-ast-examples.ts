import { ts } from 'ts-morph';

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
