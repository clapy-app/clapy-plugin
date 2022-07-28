import { getOrGenComponent } from '../3-gen-component.js';
import { genInstanceOverrides } from '../5-instance-overrides.js';
import { flags } from '../../../env-and-config/app-config.js';
import type { InstanceContext, NodeContext } from '../code.model.js';
import type { ComponentNode2, InstanceNode2, SceneNode2 } from '../create-ts-compiler/canvas-utils.js';
import { isInstance } from '../create-ts-compiler/canvas-utils.js';

export function prepareCompUsageWithOverrides(context: NodeContext, node: SceneNode2, isRootComponent = false) {
  const { parentNode, moduleContext } = context;
  const isInst = isInstance(node);

  // If component or instance, generate the code in a separate component file and reference it here.
  const componentContext = getOrGenComponent(moduleContext, node, parentNode, isRootComponent);

  node.componentContext = componentContext;

  if (!flags.enableInstanceOverrides || !isInst) {
    return componentContext;
  }

  const instanceNode = node as ComponentNode2 | InstanceNode2;
  // Get the styles for all instance overrides. Styles only, for all nodes. No need to generate any AST.
  const instanceContext: InstanceContext = {
    ...context,
    componentContext,
    nodeOfComp: componentContext.node,
    intermediateInstanceNodeOfComps: [instanceNode],
    intermediateComponentContexts: [moduleContext, componentContext],
    intermediateNodes: [node, componentContext.node],
    instanceNode,
    instanceNodeOfComp: instanceNode,
    isRootInComponent: true,
  };

  // When checking overrides, in addition to classes, we also check the swapped instances.
  genInstanceOverrides(instanceContext, node);

  return componentContext;
}
