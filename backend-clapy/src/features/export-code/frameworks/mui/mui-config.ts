import type ts from 'typescript';

import type { Dict } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../../code.model.js';
import type { InstanceNode2 } from '../../create-ts-compiler/canvas-utils.js';

export interface VariantProps {
  [figmaName: string]: PropConfig;
}

type ValidAstPropPrimitive = string | boolean;
export type ValidAstPropValue = ValidAstPropPrimitive | Exclude<ts.JsxChild, ts.JsxText>;

export interface PropConfigMap {
  name: string;
  valuesMap: Dict<ValidAstPropPrimitive>;
}

export interface PropConfigFactory {
  name: string;
  valueFactory: (figmaVal: string, node: InstanceNode2, context: NodeContext) => ValidAstPropValue | undefined;
}

export type PropConfig = PropConfigMap | PropConfigFactory;

export function isPropConfigMap(propConfig: PropConfig): propConfig is PropConfigMap {
  return !!(propConfig as PropConfigMap).valuesMap;
}

export interface MUIConfigs {
  [figmaName: string]: MUIConfig;
}

export interface MUIConfig {
  name: string;
  moduleSpecifier: string;
  variantPropsMapping: VariantProps;
  defaultProps?: any;
  extractChildren?: (node: InstanceNode2, context: NodeContext, config?: MUIConfig) => ValidAstPropValue | undefined;
}

export function makeMuiConfigs<Config extends MUIConfigs>(config: Config): Config {
  return config;
}
