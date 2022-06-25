import { getOrGenComponent } from '../3-gen-component';
import { genInstanceOverrides } from '../5-instance-overrides';
import { flags } from '../../../env-and-config/app-config';
import { InstanceContext, JsxOneOrMore, NodeContext, SwapAst } from '../code.model';
import { ComponentNode2, InstanceNode2, isInstance, SceneNode2 } from '../create-ts-compiler/canvas-utils';
import {
  createComponentUsageWithAttributes,
  getOrCreateCompContext,
  mkComponentUsage,
  mkSwapInstanceAndHideWrapper,
} from './ts-ast-utils';

export function prepareCompUsageWithOverrides(context: NodeContext, node: SceneNode2, isRootComponent = false) {
  const { parentNode, moduleContext } = context;
  const isInst = isInstance(node);

  // If component or instance, generate the code in a separate component file and reference it here.
  const componentContext = getOrGenComponent(moduleContext, node, parentNode, isRootComponent);

  if (!flags.enableInstanceOverrides || !isInst) {
    return componentContext;
  }

  node.componentContext = componentContext;

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

export function genCompUsage(node: SceneNode2) {
  if (isInstance(node)) {
    return genInstanceAst(node);
  } else {
    return genInstanceLikeAst(node);
  }
}

function genInstanceAst(node: InstanceNode2) {
  const { nodeContext: context, componentContext } = node;
  if (!componentContext) {
    throw new Error(
      `node ${node.name} should be an instance with componentContext attribute. But componentContext is undefined.`,
    );
  }
  if (!context) {
    throw new Error(`nodeContext is undefined in node ${node.name}.`);
  }
  const compContext = getOrCreateCompContext(node);
  let compAst = createComponentUsageWithAttributes(compContext, componentContext, node);

  // Surround instance usage with a syntax to swap with render props
  let compAst2: SwapAst | JsxOneOrMore = compAst;
  compAst2 = mkSwapInstanceAndHideWrapper(context, compAst, node);
  return compAst2;
}

function genInstanceLikeAst(node: SceneNode2) {
  const { nodeContext: context, componentContext } = node;
  if (!componentContext) {
    throw new Error(`[genInstanceLikeAst] node ${node.name} has no componentContext.`);
  }
  return mkComponentUsage(componentContext.compName);
}
