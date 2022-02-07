export function getPageById(pageId: string) {
  return figma.getNodeById(pageId) as PageNode;
}

const layoutTypes = new Set(['GROUP', 'SLICE', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'BOOLEAN_OPERATION', 'STAMP', 'COMPONENT_SET', 'FRAME', 'COMPONENT', 'INSTANCE']);

export function isLayout(node: BaseNode | null | undefined): node is LayoutMixin & BaseNode {
  return !!node && layoutTypes.has(node.type);
}

export function isGroup(node: BaseNode): node is GroupNode {
  return node.type === 'GROUP';
}

export function isSlice(node: BaseNode): node is SliceNode {
  return node.type === 'SLICE';
}

export function isRectangle(node: BaseNode): node is RectangleNode {
  return node.type === 'RECTANGLE';
}

export function isLine(node: BaseNode): node is LineNode {
  return node.type === 'LINE';
}

export function isEllipse(node: BaseNode): node is EllipseNode {
  return node.type === 'ELLIPSE';
}

export function isPolygon(node: BaseNode): node is PolygonNode {
  return node.type === 'POLYGON';
}

export function isStar(node: BaseNode): node is StarNode {
  return node.type === 'STAR';
}

export function isVector(node: BaseNode): node is VectorNode {
  return node.type === 'VECTOR';
}

export function isText(node: BaseNode): node is TextNode {
  return node.type === 'TEXT';
}

export function isBooleanOperation(node: BaseNode): node is BooleanOperationNode {
  return node.type === 'BOOLEAN_OPERATION';
}

export function isStamp(node: BaseNode): node is StampNode {
  return node.type === 'STAMP';
}

export function isComponentSet(node: BaseNode): node is ComponentSetNode {
  return node.type === 'COMPONENT_SET';
}

export function isFrame(node: BaseNode): node is FrameNode {
  return node.type === 'FRAME';
}

export function isComponent(node: BaseNode): node is ComponentNode {
  return node.type === 'COMPONENT';
}

export function isInstance(node: BaseNode): node is InstanceNode {
  return node.type === 'INSTANCE';
}
