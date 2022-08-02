import type { Nil } from '../../../common/general-utils.js';
import { warnOrThrow } from '../../../utils.js';
import type {
  Dict,
  FrameNodeNoMethod,
  PageNode2,
  SceneNode2,
  SceneNodeNoMethod,
} from '../../sb-serialize-preview/sb-serialize.model.js';
import { nodeDefaults } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { ChildrenMixin2, ComponentNode2, FrameNode2, InstanceNode2 } from '../create-ts-compiler/canvas-utils.js';
import { isChildrenMixin, isInstance, isInstanceFeatureDetection } from '../create-ts-compiler/canvas-utils.js';
import { warnNode } from './utils-and-reset.js';

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
  node: SceneNode2 | PageNode2 | Nil,
  instancesInComp: InstanceNode2[],
  isPage?: boolean,
) {
  if (!node) return;
  const isInst = isInstanceFeatureDetection(node);
  if (!isPage && isInst) {
    instancesInComp.push(node);
  } else {
    fillNodeWithDefaults(node, defaultsForNode(node));
    if (isChildrenMixin(node)) {
      for (const child of node.children) {
        fillWithDefaults(child, instancesInComp);
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
    addHiddenNodeToInstance(node, nodeOfComp);
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.visible || child.visible == null) {
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
}

function fillNodeWithDefaults(node: SceneNode2 | PageNode2, defaultValues: any) {
  const defaultKeys = Object.keys(defaultValues);
  for (const key of defaultKeys) {
    if (!node.hasOwnProperty(key)) {
      (node as any)[key] = defaultValues[key];
    }
  }
}

function defaultsForNode(node: SceneNode2 | PageNode2) {
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
export function addHiddenNodeToInstance(
  instance: { id: string; name: string } & ChildrenMixin2,
  nodeOfComp: SceneNode2 | undefined,
) {
  if (!isChildrenMixin(nodeOfComp)) return;
  if (instance.children.length === nodeOfComp.children.length) return;

  warnOrThrow(
    `Instance ${instance.name} and component ${nodeOfComp.name} do not have the same number of children. Is it an old version of the plugin?`,
  );

  let compStartIndex = 0;

  // TODO refactor to simplify and run faster:
  // loop on component nodes. And for each hidden node, append one in the instance as we do below.
  // The worst case complexity would go from n² to n.
  // And none of the ouputs are required anymore (to test once the code generation is stable).
  for (let i = 0; i < instance.children.length; i++) {
    const matchingCompIndex = getMatchingComponentIndex(instance, nodeOfComp, i, compStartIndex);

    for (let j = compStartIndex; j < matchingCompIndex; j++) {
      appendInvisibleElement(instance, nodeOfComp, j);
      ++i;
    }

    compStartIndex = matchingCompIndex + 1;
  }

  for (let j = compStartIndex; j < nodeOfComp.children.length; j++) {
    appendInvisibleElement(instance, nodeOfComp, j);
  }
}

function getMatchingComponentIndex(
  instance: ChildrenMixin2,
  nodeOfComp: SceneNode2 & ChildrenMixin2,
  instanceIndex: number,
  compStartIndex: number,
) {
  const instanceChild = instance.children[instanceIndex];
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
  // If no match, try to match by type + name (for instances, replace type with main component ID)
  if (matchingIndex === -1) {
    for (let j = compStartIndex; j < nodeOfComp.children.length; j++) {
      const compChild = nodeOfComp.children[j];
      const t1 = (isInstance(compChild) && compChild.mainComponent?.id) || compChild.type;
      const t2 = (isInstance(instanceChild) && instanceChild.mainComponent?.id) || instanceChild.type;
      if (t1 === t2 && compChild.name === instanceChild.name) {
        matchingIndex = j;
        break;
      }
    }
  }
  // If no match, take the first match by type (for instances, replace type with main component ID)
  if (matchingIndex === -1) {
    for (let j = compStartIndex; j < nodeOfComp.children.length; j++) {
      const compChild = nodeOfComp.children[j];
      const t1 = (isInstance(compChild) && compChild.mainComponent?.id) || compChild.type;
      const t2 = (isInstance(instanceChild) && instanceChild.mainComponent?.id) || instanceChild.type;
      if (t1 === t2) {
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

  return matchingIndex;
}

function appendInvisibleElement(
  instance: { id: string } & ChildrenMixin2,
  nodeOfComp: SceneNode2 & ChildrenMixin2,
  instanceIndex: number,
) {
  const c = instance.children as Array<SceneNode2>;
  const compChild = nodeOfComp.children[instanceIndex];
  const { id, name, type } = compChild;
  let node = { id: `${instance.id};${id}`, name, type, visible: false } as SceneNode2;
  fillNodeWithDefaults(node, defaultsForNode(node));
  if (isInstance(node) && isInstance(compChild)) {
    node.mainComponent = compChild.mainComponent;
  }
  c.splice(instanceIndex, 0, node);
}

// const inst = { id: 'i', children: [{ id: 'i;b' }, { id: 'i;d' }] } as unknown as { id: string } & ChildrenMixin2;
//
// const comp = {
//   children: [
//     { id: 'a', name: 'A', type: 'FRAME' },
//     { id: 'b', name: 'B', type: 'FRAME' },
//     { id: 'c', name: 'C', type: 'FRAME' },
//     { id: 'd', name: 'D', type: 'FRAME' },
//     { id: 'e', name: 'E', type: 'FRAME' },
//   ],
// } as unknown as SceneNode2;
// const [m] = instanceToCompIndexRemapper(inst, comp);
// console.log('---------------');
// console.log(inst);
// console.log(m);
// console.log('---------------');
