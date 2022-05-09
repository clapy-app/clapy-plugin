import { Nil } from '../../../../common/general-utils';
import {
  defaultNode,
  FrameNodeNoMethod,
  PageNodeNoMethod,
  SceneNodeNoMethod,
} from '../../../sb-serialize-preview/sb-serialize.model';
import { isChildrenMixin, isInstance } from '../../create-ts-compiler/canvas-utils';

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

const defaultNodeKeys = Object.keys(defaultNode) as Array<keyof typeof defaultNode>;

export function fillWithDefaults(node: SceneNodeNoMethod | PageNodeNoMethod | Nil) {
  if (!node || isInstance(node)) return;
  for (const key of defaultNodeKeys) {
    if (!node.hasOwnProperty(key)) {
      (node as any)[key] = defaultNode[key];
    }
  }
  if (isChildrenMixin(node)) {
    for (const child of node.children) {
      fillWithDefaults(child);
    }
  }
}
