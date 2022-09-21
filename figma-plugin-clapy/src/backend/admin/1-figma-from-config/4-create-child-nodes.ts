import equal from 'fast-deep-equal';
import type {
  BaseNode2,
  ComponentNode2,
  FrameNode2,
  GroupNode2,
  InstanceNode2,
  LineNode2,
  RectangleNode2,
  SceneNode2,
  VectorNode2,
} from '../../../common/sb-serialize.model.js';
import {
  isBlendMixin,
  isChildrenMixin2,
  isComponent,
  isComponent2,
  isFrame2,
  isLayout,
  isMinimalFillsMixin,
  isMinimalStrokesMixin,
} from '../../common/node-type-utils.js';
import { generateNode } from './3-create-parent-nodes.js';
import type { FigmaConfigContext, TextNode2, WriteableSceneNodeKeys } from './utils.js';
import { appendChild, ignoredAttributes, ensureFontIsLoaded } from './utils.js';

function isNotMixed(el: readonly Paint[] | typeof figma.mixed | readonly Effect[] | 'Mixed') {
  return el !== 'Mixed';
}

export function hydrateNewNode(newChild: BaseNode2, childConfig: BaseNode2, isSvg?: boolean) {
  for (const [attr, val] of Object.entries(childConfig)) {
    const attrTyped = attr as WriteableSceneNodeKeys;
    const arr = ['name', 'x', 'y'];
    const attributeExistsInConfigAndIsntIgnored = (childConfig as any)[attrTyped] && !ignoredAttributes.has(attr);

    if (attributeExistsInConfigAndIsntIgnored && !isSvg) {
      (newChild as any)[attrTyped] = val;
      if (isLayout(newChild) && isLayout(childConfig)) {
        //! update backend to store full configs with defaults that way this isLayout doesn't break.
        newChild.resize(childConfig.width || 0, childConfig.height || 0);
      }

      if (isMinimalFillsMixin(newChild) && isMinimalFillsMixin(childConfig) && isNotMixed(childConfig.fills)) {
        newChild.fills = childConfig.fills || [];
      }
      if (isMinimalStrokesMixin(newChild) && isMinimalStrokesMixin(childConfig) && isNotMixed(childConfig.strokes)) {
        newChild.strokes = childConfig.strokes || [];
      }
      if (isBlendMixin(newChild) && isBlendMixin(childConfig) && isNotMixed(childConfig.effects)) {
        newChild.effects = childConfig.effects || [];
      }
    } else if (attributeExistsInConfigAndIsntIgnored && isSvg && arr.includes(attrTyped)) {
      (newChild as any)[attrTyped] = val;
    }
  }
}

export function hydrateInstance(instance: BaseNode2, instanceConfig: InstanceNode2, mainComponent: ComponentNode) {
  for (const [attr, val] of Object.entries(instanceConfig)) {
    const attrTyped = attr as WriteableSceneNodeKeys;
    const attributeExistsInConfigAndIsntIgnored = (instanceConfig as any)[attrTyped] && !ignoredAttributes.has(attr);

    if (
      attributeExistsInConfigAndIsntIgnored &&
      !equal((instanceConfig as any)[attrTyped], (mainComponent as any)[attrTyped])
    ) {
      (instance as any)[attrTyped] = val;
    }
  }
}

export async function generateGroupNode(
  parentNode: BaseNode & ChildrenMixin,
  node: GroupNode2,
  ctx: FigmaConfigContext,
) {
  return await generateGroupChildNodes(parentNode, node, ctx);
}

export async function generateFrameNode(
  parentNode: BaseNode & ChildrenMixin,
  node: FrameNode2,
  ctx: FigmaConfigContext,
) {
  const frame = figma.createFrame();
  appendChild(parentNode, frame);
  hydrateNewNode(frame, node);
  await generateChildNodes(frame, node, ctx);
  return frame;
}

function createComponent(oldComponentId: string, ctx: FigmaConfigContext) {
  let component;
  if (oldComponentId in ctx.oldComponentIdsToNewDict) {
    component = ctx.configPage.findOne(el => el.id === ctx.oldComponentIdsToNewDict[oldComponentId]);
  } else {
    component = figma.createComponent();
    ctx.oldComponentIdsToNewDict[oldComponentId] = component.id;
  }
  return component;
}

function isComponentCreated(oldComponentId: string, ctx: FigmaConfigContext) {
  return oldComponentId in ctx.oldComponentIdsToNewDict;
}

export async function generateComponent(
  parentNode: BaseNode & ChildrenMixin,
  node: ComponentNode2,
  ctx: FigmaConfigContext,
  isConfig?: boolean,
) {
  if (isComponentCreated(node.id, ctx)) {
    return ctx.configPage.findOne(el => el.id === ctx.oldComponentIdsToNewDict[node.id]);
  }
  let component = createComponent(node.id, ctx);

  if (isComponent(component)) {
    hydrateNewNode(component, node);
    if (isConfig) {
      parentNode = ctx.configPage;
      component.x = ctx.componentsCoordinates.x;
      component.y = ctx.componentsCoordinates.y;
      ctx.componentsCoordinates.y += ctx.componentsCoordinates.previousComponentHeight + 200;
      ctx.componentsCoordinates.previousComponentHeight = node.height;
    }
    appendChild(parentNode, component);
    await generateChildNodes(component, node, ctx);
    return component;
  }
}

export async function generateComponents(parentNode: BaseNode & ChildrenMixin, ctx: FigmaConfigContext) {
  if (ctx.components) {
    for (const component of ctx.components) {
      generateComponent(parentNode, component, ctx, true);
    }
  }
}

export async function generateInstance(
  parentNode: BaseNode & ChildrenMixin,
  node: InstanceNode2,
  ctx: FigmaConfigContext,
  mainComponentId: string,
) {
  const mainComponent = figma.currentPage.findOne(n => n.id === mainComponentId);
  if (isComponent(mainComponent)) {
    const instance = mainComponent.createInstance();
    appendChild(parentNode, instance);
    // TODO comparer et hydrater que les valeurs des propriétés qui change entre le composant et l'instance.
    // hydrateNewNode(instance, node, true);
    hydrateInstance(instance, node, mainComponent);
    await generateChildNodes(instance, node, ctx);
    return instance;
  }
}

export async function generateTextNode(parentNode: ChildrenMixin, node: TextNode2, ctx: FigmaConfigContext) {
  await ensureFontIsLoaded({ family: 'Inter', style: 'Regular' });
  await ensureFontIsLoaded({ family: 'Inter', style: 'Medium' });

  const text = figma.createText();
  parentNode.appendChild(text);

  hydrateNewNode(text, node);

  for (const textSegment of node._textSegments) {
    await ensureFontIsLoaded(textSegment.fontName);
    const start = textSegment.start;
    const end = textSegment.end;
    text.insertCharacters(start, textSegment.characters);
    text.setRangeFontSize(start, end, textSegment.fontSize);
    text.setRangeFontName(start, end, textSegment.fontName);
    text.setRangeTextCase(start, end, textSegment.textCase);
    text.setRangeTextDecoration(start, end, textSegment.textDecoration);
    text.setRangeLetterSpacing(start, end, textSegment.letterSpacing);
    text.setRangeLineHeight(start, end, textSegment.lineHeight);
    text.setRangeHyperlink(start, end, textSegment.hyperlink);
    text.setRangeFills(start, end, textSegment.fills);
    text.setRangeTextStyleId(start, end, textSegment.textStyleId);
    text.setRangeFillStyleId(start, end, textSegment.fillStyleId);
    text.setRangeListOptions(start, end, textSegment.listOptions);
    text.setRangeIndentation(start, end, textSegment.indentation);
  }
  return text;
}

export async function generateRectancle(parentNode: ChildrenMixin, node: RectangleNode2, ctx: FigmaConfigContext) {
  const rectangle = figma.createRectangle();
  parentNode.appendChild(rectangle);
  hydrateNewNode(rectangle, node);
  return rectangle;
}

export async function generateLineNode(parentNode: ChildrenMixin, node: LineNode2, ctx: FigmaConfigContext) {
  const line = figma.createLine();
  parentNode.appendChild(line);
  hydrateNewNode(line, node);
  line.resizeWithoutConstraints(node.width, node.height);

  return line;
}

export async function generateVectorNode(parentNode: ChildrenMixin, node: VectorNode2, ctx: FigmaConfigContext) {
  if (ctx.svgs == null) {
    throw new Error('Problem with this config, found vectorNode to render but svgs array is empty.');
  }

  const vector = figma.createNodeFromSvg(ctx.svgs[node.id]['svg']);
  parentNode.appendChild(vector);
  hydrateNewNode(vector, node, true);
  vector.clipsContent = false;

  return vector;
}

async function generateChildNodes(
  parentNode: BaseNode & ChildrenMixin,
  nodeConfig: SceneNode2,
  ctx: FigmaConfigContext,
) {
  if (isFrame2(nodeConfig) || isComponent2(nodeConfig)) {
    for (let child of nodeConfig.children) {
      const element = await generateNode(parentNode, child, ctx);
      if (element) {
        appendChild(parentNode, element);
      }
    }
  }
}

async function generateGroupChildNodes(
  parentNode: BaseNode & ChildrenMixin,
  nodeConfig: SceneNode2,
  ctx: FigmaConfigContext,
) {
  let groupElements: BaseNode[] = [];

  if (isChildrenMixin2(nodeConfig)) {
    for (let child of nodeConfig.children) {
      const element = await generateNode(parentNode, child, ctx);
      if (element) groupElements.push(element);
    }
  }

  const group = figma.group(groupElements, parentNode);
  hydrateNewNode(group, nodeConfig);
  return group;
}
