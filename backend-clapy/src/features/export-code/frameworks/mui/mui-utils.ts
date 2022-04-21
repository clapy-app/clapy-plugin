import { ts } from 'ts-morph';

import { Dict } from '../../../sb-serialize-preview/sb-serialize.model';
import { ComponentContext, NodeContext } from '../../code.model';
import { InstanceNode2, isComponentSet, isInstance, SceneNode2 } from '../../create-ts-compiler/canvas-utils';
import { muiComponents, MUIConfig, MUIConfigs } from './mui-config';

const { factory } = ts;

function mapProps(node: InstanceNode2, config: MUIConfig) {
  if (!node.variantProperties) return {};
  // Convert { "Size": "Medium*" } (figma) to { "size": "medium" } (code)
  return Object.fromEntries(
    Object.entries(node.variantProperties).reduce((acc, [figmaName, figmaVal]) => {
      const propConfig = config.variantPropsMapping[figmaName];
      if (propConfig) {
        const { name, valuesMap } = propConfig;
        if (valuesMap[figmaVal]) {
          acc.push([name, valuesMap[figmaVal]]);
        } else {
          console.warn(
            'Unsupported Figma value for component:',
            `${config.name},`,
            'Figma prop:',
            `${figmaName},`,
            'value:',
            figmaVal,
            `(${typeof figmaVal})`,
          );
        }
      } else {
        console.warn('Unsupported Figma prop for component:', config.name, ', Figma prop:', figmaName);
      }
      return acc;
    }, [] as Array<string | any>),
  );
}

export function checkAndProcessMuiComponent(context: NodeContext, node: SceneNode2) {
  const {
    componentContext: { projectContext },
  } = context;
  const { enableMUIFramework } = projectContext;
  // MUI must be enabled
  if (!enableMUIFramework) {
    return false;
  }
  // If not an instance of variant of component, KO
  if (!isInstance(node) || !node.mainComponent || !isComponentSet(node.mainComponent.parent)) {
    return false;
  }
  // If the component name is not found in the supported components, KO
  const config = (muiComponents as MUIConfigs)[node.mainComponent.parent.name];
  if (!config) {
    return false;
  }
  return config;
}

export function addMuiImport(context: ComponentContext, config: MUIConfig) {
  context.file.addImportDeclaration({
    moduleSpecifier: config.moduleSpecifier,
    namedImports: [config.name],
  });
}

export function mkMuiComponentAst(config: MUIConfig, node: InstanceNode2, attributes: ts.JsxAttribute[]) {
  const children = config.extractChildren?.(node, config);
  return _mkMuiComponent(config.name, { ...config.defaultProps, ...mapProps(node, config) }, attributes, children);
}

function _mkMuiComponent(name: string, props: Dict<any> = {}, attributes: ts.JsxAttribute[], children?: string) {
  children = children || props.children;
  if (children && typeof children !== 'string') {
    throw new Error(`Unsupported children type, only strings are supported: ${JSON.stringify(children)}`);
  }
  return factory.createJsxElement(
    factory.createJsxOpeningElement(
      factory.createIdentifier(name),
      undefined,
      factory.createJsxAttributes([
        ...attributes,
        ...Object.entries(props).map(([name, value]) =>
          factory.createJsxAttribute(
            factory.createIdentifier(name),
            typeof value === 'string'
              ? factory.createStringLiteral(value)
              : factory.createJsxExpression(undefined, factory.createStringLiteral(value)),
          ),
        ),
      ]),
    ),
    children ? [factory.createJsxText(children, false)] : [],
    factory.createJsxClosingElement(factory.createIdentifier('Button')),
  );
}
