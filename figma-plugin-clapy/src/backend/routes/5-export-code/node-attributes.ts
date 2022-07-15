import equal from 'fast-deep-equal';

import type {
  BooleanOperationNode2,
  Dict2,
  Dict3,
  EllipseNode2,
  FrameNode2,
  LayoutTypes,
  PolygonNode2,
  StarNode2,
  VectorNode2,
} from '../../../common/sb-serialize.model';
import { extractionBlacklist, nodeDefaults } from '../../../common/sb-serialize.model';
import type { LayoutNode } from '../../common/node-type-utils';
import { isChildrenMixin } from '../../common/node-type-utils';

// Extracted from Figma typings
type StyledTextSegment2 = Omit<StyledTextSegment, 'characters' | 'start' | 'end'>;
type RangeProp = keyof StyledTextSegment2;

export const rangeProps: RangeProp[] = [
  'fillStyleId',
  'fills',
  'fontName',
  'fontSize',
  'hyperlink',
  'indentation',
  'letterSpacing',
  'lineHeight',
  'listOptions',
  'textCase',
  'textDecoration',
  'textStyleId',
];
/* as Writeable<typeof rangeProps> */
const extractionBlacklist2 = [...extractionBlacklist, 'id', 'type', 'componentPropertyDefinitions'];
const blacklist = new Set<string>(extractionBlacklist2);
const textBlacklist = new Set<string>([...extractionBlacklist2, ...rangeProps, 'characters']);

// We prepare the list of fields we want to extract from Figma.
// It is derived from the default values configured in sb-serialize.model.
export const nodeAttributes = {} as Dict3<LayoutTypes, string[]>;
for (const [nodeType, defaultValues] of Object.entries(nodeDefaults)) {
  const key = nodeType as LayoutTypes;
  const bl = key === 'TEXT' ? textBlacklist : blacklist;

  const attrs = Object.keys(defaultValues).filter(attr => !bl.has(attr));

  nodeAttributes[key] = attrs;
}

const equalityBlacklist = new Set<keyof (FrameNode2 & InstanceNode)>([
  'id',
  'mainComponent',
  'name',
  'x',
  'y',
  'constraints',
  'componentPropertyReferences',
  'variantGroupProperties',
  'variantProperties',
  'componentPropertyDefinitions',
  'componentProperties',
]);
const vectorEqualityFields = [
  'vectorPaths',
  'vectorNetwork',
  // 'strokeGeometry',
  // 'fillGeometry',
];
const equalityExtraFields: Dict2<LayoutTypes, Array<keyof (FrameNode2 & VectorNode2)>> = {
  VECTOR: vectorEqualityFields,
};
const equalityAttributes = {} as Dict3<LayoutTypes, string[]>;
for (const [nodeType, attributes] of Object.entries(nodeAttributes)) {
  const key = nodeType as LayoutTypes;

  const attrs = attributes.filter(attr => !equalityBlacklist.has(attr));
  const extraFields = equalityExtraFields[key] as string[] | undefined;
  if (extraFields) {
    attrs.push(...extraFields);
  }

  equalityAttributes[key] = attrs;
}

// console.log(equalityAttributes);
// equalityAttributes.ELLIPSE
// equalityAttributes.POLYGON
// equalityAttributes.STAR
// equalityAttributes.VECTOR
// equalityAttributes.BOOLEAN_OPERATION
// equalityAttributes.FRAME // If it is a mask

const svgFields = Array.from(
  new Set([
    ...equalityAttributes.ELLIPSE,
    ...equalityAttributes.POLYGON,
    ...equalityAttributes.STAR,
    ...equalityAttributes.VECTOR,
    ...equalityAttributes.BOOLEAN_OPERATION,
  ]),
);
// console.log('svgFields');
// console.log(svgFields);

type SVGNode = EllipseNode | PolygonNode | StarNode | VectorNode | BooleanOperationNode | FrameNode;
type SVGKeys =
  | keyof EllipseNode2
  | keyof PolygonNode2
  | keyof StarNode2
  | keyof VectorNode2
  | keyof BooleanOperationNode2
  | typeof vectorEqualityFields[number];

const svgFieldsShallowEq: Array<SVGKeys> = [
  'opacity',
  'blendMode',
  'isMask',
  'effectStyleId',
  'strokeStyleId',
  'strokeWeight',
  'strokeJoin',
  'strokeAlign',
  'fillStyleId',
  // 'strokeCap',
  // 'strokeMiterLimit',
  // 'width',
  // 'height',
  // 'pointCount',
  // 'innerRadius',
  // 'handleMirroring',
  // 'booleanOperation',
];

const svgFieldsDeepEq: Array<SVGKeys> = [
  // 'effects',
  // 'strokes',
  // 'dashPattern',
  // 'fills',
  // 'relativeTransform',
  // 'vectorPaths',
  // 'vectorNetwork',
];

// Optimized function to compare two Figma nodes that are to be converted to SVG.
// Because the generic implementation from areNodesEqual is very expensive.
export function areSvgEqual(node1: LayoutNode | undefined, node2: LayoutNode | undefined) {
  if (node1 === node2) return true;
  if (!node1 || !node2 || node1.type !== node2.type) {
    return false;
  }
  const attrs = equalityAttributes[node1.type];
  for (const attr of svgFieldsShallowEq) {
    if (node1[attr as keyof LayoutNode] !== node2[attr as keyof LayoutNode]) {
      return false;
    }
  }
  for (const attr of svgFieldsDeepEq) {
    if (!equal(node1[attr as keyof LayoutNode], node2[attr as keyof LayoutNode])) {
      return false;
    }
  }
  const node1HasChildren = isChildrenMixin(node1);
  const node2HasChildren = isChildrenMixin(node2);
  if (node1HasChildren !== node2HasChildren) {
    return false;
  }
  if (node1HasChildren && node2HasChildren) {
    if (node1.children.length !== node2.children.length) {
      return false;
    }
    for (let i = 0; i < node1.children.length; i++) {
      const child1 = node1.children[i];
      const child2 = node2.children[i];
      if (!areNodesEqual(child1 as LayoutNode, child2 as LayoutNode)) {
        return false;
      }
    }
  }
  return true;
}

export function areNodesEqual(node1: LayoutNode | undefined, node2: LayoutNode | undefined) {
  if (node1 === node2) return true;
  if (!node1 || !node2 || node1.type !== node2.type) {
    return false;
  }
  const attrs = equalityAttributes[node1.type];
  for (const attr of attrs) {
    if (!equal(node1[attr as keyof LayoutNode], node2[attr as keyof LayoutNode])) {
      return false;
    }
  }
  const node1HasChildren = isChildrenMixin(node1);
  const node2HasChildren = isChildrenMixin(node2);
  if (node1HasChildren !== node2HasChildren) {
    return false;
  }
  if (node1HasChildren && node2HasChildren) {
    if (node1.children.length !== node2.children.length) {
      return false;
    }
    for (let i = 0; i < node1.children.length; i++) {
      const child1 = node1.children[i];
      const child2 = node2.children[i];
      if (!areNodesEqual(child1 as LayoutNode, child2 as LayoutNode)) {
        return false;
      }
    }
  }
  return true;
}
