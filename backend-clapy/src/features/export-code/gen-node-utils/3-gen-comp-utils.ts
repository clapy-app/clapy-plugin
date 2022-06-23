import { getOrGenComponent } from '../3-gen-component';
import { genInstanceOverrides } from '../5-instance-overrides';
import { flags } from '../../../env-and-config/app-config';
import { CompAst, InstanceContext, JsxOneOrMore, ModuleContext, NodeContext, SwapAst } from '../code.model';
import { ComponentNode2, InstanceNode2, isInstance, SceneNode2 } from '../create-ts-compiler/canvas-utils';
import {
  createComponentUsageWithAttributes,
  getOrCreateCompContext,
  mkComponentUsage,
  mkSwapInstanceAndHideWrapper,
} from './ts-ast-utils';

// TODO utiliser cette fonction sur le noeud root, en différenciant les cas comp/instance vs autre.
// Dans 2-... si pas une instance, il y a moins de choses à faire ci-dessous
export function genCompUsageAstWithOverrides(
  context: NodeContext,
  node: SceneNode2,
  isRootComponent = false,
): readonly [ModuleContext, CompAst] {
  const { parentNode, moduleContext } = context;
  const isInst = isInstance(node);

  // If component or instance, generate the code in a separate component file and reference it here.
  const componentContext = getOrGenComponent(moduleContext, node, parentNode, isRootComponent);

  if (!flags.enableInstanceOverrides || !isInst) {
    return [componentContext, mkComponentUsage(componentContext.compName)] as const;
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

  const compContext = getOrCreateCompContext(node);

  let compAst = createComponentUsageWithAttributes(compContext, componentContext, node);

  // Surround instance usage with a syntax to swap with render props
  let compAst2: SwapAst | JsxOneOrMore = compAst;
  compAst2 = mkSwapInstanceAndHideWrapper(context, compAst, node);

  return [componentContext, compAst2] as const;
}
