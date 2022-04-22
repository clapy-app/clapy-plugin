import { ts } from 'ts-morph';
import { Dict } from '../../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../../code.model';
import { InstanceNode2 } from '../../create-ts-compiler/canvas-utils';

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
  extractChildren?: (node: InstanceNode2, config?: MUIConfig) => string | undefined;
  defaultProps?: any;
}

export function makeMuiConfigs<Config extends MUIConfigs>(config: Config): Config {
  return config;
}
