import ts from 'typescript';

import { Dict } from '../../../sb-serialize-preview/sb-serialize.model';
import { ComponentContext, NodeContext } from '../../code.model';
import { InstanceNode2, isComponentSet, isInstance, SceneNode2 } from '../../create-ts-compiler/canvas-utils';
import {
  genUniqueName,
  mkDefaultImportDeclaration,
  mkNamedImportsDeclaration,
} from '../../figma-code-map/details/ts-ast-utils';
import { muiComponents } from './mui-all-components';
import { isPropConfigMap, MUIConfig, MUIConfigs, ValidAstPropValue } from './mui-config';

const { factory } = ts;

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
  const { imports, subComponentNamesAlreadyUsed, importsAlreadyAdded } = context;
  const importHashKey = `${config.name}__${config.moduleSpecifier}`;
  if (!importsAlreadyAdded.has(importHashKey)) {
    // Rename import name if already in scope
    const name = genUniqueName(subComponentNamesAlreadyUsed, config.name, true);
    imports.push(
      mkNamedImportsDeclaration([name === config.name ? name : [config.name, name]], config.moduleSpecifier),
    );
    if (name !== config.name) {
      config = { ...config, name };
    }
    importsAlreadyAdded.set(importHashKey, name);
  } else {
    const name = importsAlreadyAdded.get(importHashKey);
    if (name && name !== config.name) {
      config = { ...config, name };
    }
  }
  return config;
}

export function mkMuiComponentAst(
  context: NodeContext,
  config: MUIConfig,
  node: InstanceNode2,
  attributes: ts.JsxAttribute[],
) {
  const children = config.extractChildren?.(node, context, config);
  return _mkMuiComponent(
    config.name,
    { ...config.defaultProps, ...mapProps(context, node, config) },
    attributes,
    children,
  );
}

function _mkMuiComponent(
  name: string,
  props: Dict<ValidAstPropValue> = {},
  attributes: ts.JsxAttribute[],
  children?: ValidAstPropValue,
) {
  children = children || props.children;
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
              : factory.createJsxExpression(
                  undefined,
                  typeof value === 'boolean' ? (value ? factory.createTrue() : factory.createFalse()) : value,
                ),
          ),
        ),
      ]),
    ),
    !children
      ? []
      : typeof children === 'boolean'
      ? [factory.createJsxText(children.toString(), false)]
      : typeof children === 'string'
      ? [factory.createJsxText(children, false)]
      : [children],
    factory.createJsxClosingElement(factory.createIdentifier(name)),
  );
}

function mapProps(context: NodeContext, node: InstanceNode2, config: MUIConfig) {
  if (!node.variantProperties) return {};
  // Convert { "Size": "Medium*" } (figma) to { "size": "medium" } (code)
  const entries = Object.entries(node.variantProperties).reduce((acc, [figmaName, figmaVal]) => {
    const propConfig = config.variantPropsMapping[figmaName];
    if (propConfig) {
      if (isPropConfigMap(propConfig)) {
        const { name, valuesMap } = propConfig;
        if (valuesMap[figmaVal]) {
          acc.push([name, valuesMap[figmaVal]]);
          // The warning could be useful for development, when adding new components and properties.
          // } else {
          //   console.warn(
          //     'Unsupported Figma value for component:',
          //     `${config.name},`,
          //     'Figma prop:',
          //     `${figmaName},`,
          //     'value:',
          //     figmaVal,
          //     `(${typeof figmaVal})`,
          //   );
        }
      } else {
        const { name, valueFactory } = propConfig;
        const propValue = valueFactory(figmaVal, node, context);
        if (propValue) {
          acc.push([name, propValue]);
          // } else {
          //   console.warn(
          //     'Unsupported Figma value for component:',
          //     `${config.name},`,
          //     'Figma prop:',
          //     `${figmaName},`,
          //     'value:',
          //     figmaVal,
          //     `(${typeof figmaVal}) - factory`,
          //   );
        }
      }
    } else {
      console.warn('Unsupported Figma prop for component:', `${config.name},`, 'Figma prop:', figmaName);
    }
    return acc;
  }, [] as Array<[string, ValidAstPropValue]>);
  return Object.fromEntries(entries);
}

/** Returns import and JSX AST */
export function iconInstanceToAst(icon: InstanceNode2 | undefined, size?: 'small' | 'medium' | 'large' | 'inherit') {
  let iconName = icon?.mainComponent?.name;
  if (!iconName) return [];
  if (iconName?.endsWith('Filled')) {
    iconName = iconName.slice(0, -6);
  }
  const iconVarName = `${iconName}Icon`;
  return [
    mkDefaultImportDeclaration(iconVarName, `@mui/icons-material/${iconName}`),
    factory.createJsxSelfClosingElement(
      factory.createIdentifier(iconVarName),
      undefined,
      factory.createJsxAttributes(
        size
          ? [factory.createJsxAttribute(factory.createIdentifier('fontSize'), factory.createStringLiteral(size))]
          : [],
      ),
    ),
  ] as const;
}
