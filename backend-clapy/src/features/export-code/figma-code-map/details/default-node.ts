import { Nil } from '../../../../common/general-utils';
import {
  defaultNode,
  Dict,
  FrameNodeNoMethod,
  PageNodeNoMethod,
  SceneNodeNoMethod,
} from '../../../sb-serialize-preview/sb-serialize.model';
import { ComponentNode2, isChildrenMixin, isInstance } from '../../create-ts-compiler/canvas-utils';

export function makeDefaultNode(name: string, ...nodeOverrides: Partial<FrameNodeNoMethod>[]): FrameNodeNoMethod {
  return Object.assign({ ...defaultNode, name }, ...nodeOverrides);
}

export function addHugContents(): Partial<FrameNodeNoMethod> {
  return {
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    layoutGrow: 0,
    layoutAlign: 'INHERIT',
  };
}

const defaultNodeKeys = Object.keys(defaultNode);

export function fillWithDefaults(node: SceneNodeNoMethod | PageNodeNoMethod | Nil, compNodes?: Dict<ComponentNode2>) {
  if (!node) return;
  const [defaultKeys, defaultValues] =
    compNodes && isInstance(node) && node.mainComponent
      ? [Object.keys(compNodes[node.mainComponent.id]), compNodes[node.mainComponent.id] as any]
      : [defaultNodeKeys, defaultNode as any];
  for (const key of defaultKeys) {
    if (!node.hasOwnProperty(key)) {
      (node as any)[key] = defaultValues[key];
    }
  }
  if (isChildrenMixin(node)) {
    for (const child of node.children) {
      fillWithDefaults(child, compNodes);
    }
  }
}
