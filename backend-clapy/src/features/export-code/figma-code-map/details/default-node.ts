import { Nil } from '../../../../common/general-utils';
import {
  Dict,
  FrameNodeNoMethod,
  nodeDefaults,
  PageNodeNoMethod,
  SceneNodeNoMethod,
} from '../../../sb-serialize-preview/sb-serialize.model';
import { ComponentNode2, isChildrenMixin, isInstanceFeatureDetection } from '../../create-ts-compiler/canvas-utils';
import { warnNode } from './utils-and-reset';

export function makeDefaultNode(name: string, ...nodeOverrides: Partial<FrameNodeNoMethod>[]): FrameNodeNoMethod {
  return Object.assign({ ...nodeDefaults.FRAME, name }, ...nodeOverrides);
}

export function addHugContents(): Partial<FrameNodeNoMethod> {
  return {
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    layoutGrow: 0,
    layoutAlign: 'INHERIT',
  };
}

export function fillWithDefaults(node: SceneNodeNoMethod | PageNodeNoMethod | Nil) {
  if (!node) return;
  fillNodeWithDefaults(node, defaultsForNode(node));
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
  const isInst = isInstanceFeatureDetection(node);
  if (!nodeOfComp && !isInst) {
    fillNodeWithDefaults(node, defaultsForNode(node));
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
    fillNodeWithDefaults(node, nodeOfComp);
  }
  if (isChildrenMixin(node)) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      let childNodeOfComp = nodeOfComp;
      if (childNodeOfComp) {
        if (!isChildrenMixin(childNodeOfComp)) {
          warnNode(
            child,
            `BUG Instance node ${node.name} has children, but the corresponding component node does not.`,
          );
          throw new Error(
            `BUG Instance node ${node.name} has children, but the corresponding component node does not.`,
          );
        }
        childNodeOfComp = childNodeOfComp.children[i];
      }
      fillWithComponent(child, compNodes, childNodeOfComp);
    }
  }
}

function fillNodeWithDefaults(node: SceneNodeNoMethod | PageNodeNoMethod, defaultValues: any) {
  const defaultKeys = Object.keys(defaultValues);
  for (const key of defaultKeys) {
    if (!node.hasOwnProperty(key)) {
      (node as any)[key] = defaultValues[key];
    }
  }
}

function defaultsForNode(node: SceneNodeNoMethod | PageNodeNoMethod) {
  let type = node.type as keyof typeof nodeDefaults;
  if (!nodeDefaults[type]) {
    warnNode(node, 'Node type is not found in the defaults available. Falling back to Frame defaults.');
    type = 'FRAME';
  }
  return nodeDefaults[type];
}
