import { Nil } from '../../../../common/general-utils';
import {
  defaultNode,
  Dict,
  FrameNodeNoMethod,
  PageNodeNoMethod,
  SceneNodeNoMethod,
} from '../../../sb-serialize-preview/sb-serialize.model';
import { ComponentNode2, isChildrenMixin, isInstance } from '../../create-ts-compiler/canvas-utils';
import { warnNode } from './utils-and-reset';

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

export function fillWithDefaults(node: SceneNodeNoMethod | PageNodeNoMethod | Nil) {
  if (!node) return;
  fillNodeWithDefaults(node, defaultNodeKeys, defaultNode);
  if (isChildrenMixin(node)) {
    for (const child of node.children) {
      fillWithDefaults(child);
    }
  }
}

export function fillWithComponent(
  node: SceneNodeNoMethod | Nil,
  compNodes: Dict<ComponentNode2>,
  nodeOfComp?: SceneNodeNoMethod,
) {
  if (!node) return;
  const isInst = isInstance(node) && node.mainComponent;
  if (!nodeOfComp && !isInst) {
    fillNodeWithDefaults(node, defaultNodeKeys, defaultNode);
  } else {
    if (isInst) {
      nodeOfComp = compNodes[node.mainComponent!.id];
      if (!nodeOfComp) {
        throw new Error(`Component not found for instance ${node.name} when filling the default values.`);
      }
    }
    if (!nodeOfComp) {
      throw new Error('nodeOfComp is undefined, which should be impossible here. Bug?');
    }
    const defaultKeys = Object.keys(nodeOfComp);
    fillNodeWithDefaults(node, defaultKeys, nodeOfComp);
  }
  if (isChildrenMixin(node)) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (nodeOfComp) {
        if (!isChildrenMixin(nodeOfComp)) {
          warnNode(
            child,
            `BUG Instance node ${child.name} has children, but the corresponding component node does not.`,
          );
          throw new Error(
            `BUG Instance node ${child.name} has children, but the corresponding component node does not.`,
          );
        }
        nodeOfComp = nodeOfComp.children[i];
      }
      fillWithComponent(child, compNodes, nodeOfComp);
    }
  }
}

function fillNodeWithDefaults(node: SceneNodeNoMethod | PageNodeNoMethod, defaultKeys: string[], defaultValues: any) {
  for (const key of defaultKeys) {
    if (!node.hasOwnProperty(key)) {
      (node as any)[key] = defaultValues[key];
    }
  }
}
