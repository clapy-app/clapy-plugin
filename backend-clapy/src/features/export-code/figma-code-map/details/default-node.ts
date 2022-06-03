import { Nil } from '../../../../common/general-utils';
import { flags } from '../../../../env-and-config/app-config';
import {
  Dict,
  FrameNodeNoMethod,
  nodeDefaults,
  PageNodeNoMethod,
  SceneNodeNoMethod,
} from '../../../sb-serialize-preview/sb-serialize.model';
import {
  ChildrenMixin2,
  ComponentNode2,
  FrameNode2,
  InstanceNode2,
  isChildrenMixin,
  isInstanceFeatureDetection,
  SceneNode2,
} from '../../create-ts-compiler/canvas-utils';
import { warnNode } from './utils-and-reset';

export function makeDefaultNode(name: string, ...nodeOverrides: Partial<FrameNode2>[]): FrameNodeNoMethod {
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

export function fillWithDefaults(
  node: SceneNodeNoMethod | PageNodeNoMethod | Nil,
  instancesInComp: InstanceNode2[],
  inComp?: boolean,
  isPage?: boolean,
) {
  if (!node) return;
  const isInst = isInstanceFeatureDetection(node);
  if (flags.stripInstancesInComponents && inComp && isInst) {
    // An instance inside a component (outside the selection): ignore it.
    // The instance in the selection will be used instead.
    return;
  } else if (!isPage && isInst) {
    instancesInComp.push(node);
  } else {
    fillNodeWithDefaults(node, defaultsForNode(node));
    if (isChildrenMixin(node)) {
      for (const child of node.children) {
        fillWithDefaults(child, instancesInComp, inComp);
      }
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
    const [instanceToCompIndexMap, hiddenNodes] = instanceToCompIndexRemapper(node, nodeOfComp);
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      let childNodeOfComp = nodeOfComp;
      if (childNodeOfComp && instanceToCompIndexMap) {
        if (!isChildrenMixin(childNodeOfComp)) {
          warnNode(
            child,
            `BUG Instance node ${node.name} has children, but the corresponding component node does not.`,
          );
          throw new Error(
            `BUG Instance node ${node.name} has children, but the corresponding component node does not.`,
          );
        }
        childNodeOfComp = childNodeOfComp.children[instanceToCompIndexMap[i]];
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

/**
 * Workaround: instances and their components don't have the same children. anInstance.children seems to exclude non-visible elements, although myComponent.children includes non-visible elements. So indexes in the array of children don't match (shift). Easy fix: we map indexes. We use it to get, for a given element in an instance, the corresponding element in the component.
 */
export function instanceToCompIndexRemapper(instance: ChildrenMixin2, nodeOfComp: SceneNode2 | undefined) {
  if (!isChildrenMixin(nodeOfComp)) return [undefined, undefined];
  const mapper: Dict<number> = {};
  let compStartIndex = 0;
  const hiddenNodes: number[] = [];
  for (let i = 0; i < instance.children.length; i++) {
    const instanceChild = instance.children[i];
    const childId = instanceChild.id;
    const compId = childId.substring(childId.lastIndexOf(';') + 1);

    // First, try to match by ID
    let matchingIndex = -1;
    for (let j = compStartIndex; j < nodeOfComp.children.length; j++) {
      const compChild = nodeOfComp.children[j];
      if (compChild.id === compId) {
        matchingIndex = j;
        break;
      }
    }
    // If no match, try to match by type + name
    if (matchingIndex === -1) {
      for (let j = compStartIndex; j < nodeOfComp.children.length; j++) {
        const compChild = nodeOfComp.children[j];
        if (compChild.type === instanceChild.type && compChild.name === instanceChild.name) {
          matchingIndex = j;
          break;
        }
      }
    }
    // If no match, take the first match by type
    if (matchingIndex === -1) {
      for (let j = compStartIndex; j < nodeOfComp.children.length; j++) {
        const compChild = nodeOfComp.children[j];
        if (compChild.type === instanceChild.type) {
          matchingIndex = j;
          break;
        }
      }
    }
    // If still no match, it's a bug. We fallback to the first child of the list, but may be wrong if the component has hidden elements.
    if (matchingIndex === -1) {
      // TODO improve
      // warnNode(
      //   instance as unknown as SceneNode2,
      //   'No match found for child at index',
      //   i,
      //   'with the corresponding component',
      //   nodeOfComp,
      //   '- falling back to the next component child.',
      // );
      matchingIndex = compStartIndex;
    }

    for (let j = compStartIndex; j < matchingIndex; j++) {
      hiddenNodes.push(j);
    }

    mapper[i] = matchingIndex;
    compStartIndex = matchingIndex + 1;
  }

  for (let j = compStartIndex; j < nodeOfComp.children.length; j++) {
    hiddenNodes.push(j);
  }

  return [mapper, hiddenNodes] as const;
}
