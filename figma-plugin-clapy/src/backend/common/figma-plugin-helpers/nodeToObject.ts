import { SceneNodeNoMethod } from '../../../common/sb-serialize.model';
import { isChildrenMixin, isInstance, isText } from '../canvas-utils';

// Extracted from Figma typings
type RangeProp = keyof Omit<StyledTextSegment, 'characters' | 'start' | 'end'>;

const baseBlacklist = [
  'parent',
  'children',
  'removed',
  'masterComponent',
  'mainComponent',
  'horizontalPadding',
  'verticalPadding',
  'cornerRadius',
] as const;
const rangeProps: RangeProp[] = [
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
]; /* as const */
/* as Writeable<typeof rangeProps> */
const blacklist = new Set<string>(baseBlacklist);
const textBlacklist = new Set<string>([...baseBlacklist, ...rangeProps, 'characters']);

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Transform node to object with keys, that are hidden by default.
 * For example:
 * ```ts
 * const node = figma.currentPage.findOne((el) => el.type === "TEXT");
 * console.log(Object.keys(node).length) // 1
 * console.log(Object.keys(nodeToObject(node)).length) // 42
 * console.log(Object.keys(nodeToObject(node, true)).length) // 39
 * ```
 *
 * @param node
 * @param withoutRelations
 */
export function nodeToObject<T extends SceneNode>(node: T, withoutRelations?: boolean) {
  const props = Object.entries(Object.getOwnPropertyDescriptors((node as any).__proto__));
  const obj: any = { id: node.id, type: node.type };
  const isTxt = isText(node);
  const bl = isTxt ? textBlacklist : blacklist;
  for (const [name, prop] of props) {
    if (prop.get && !bl.has(name)) {
      try {
        if (typeof obj[name] === 'symbol') {
          obj[name] = 'Mixed';
        } else {
          obj[name] = prop.get.call(node);
        }
      } catch (err) {
        obj[name] = undefined;
      }
    }
  }
  if (isTxt) {
    obj._textSegments = node.getStyledTextSegments(rangeProps);
  }
  if (node.parent && !withoutRelations) {
    obj.parent = { id: node.parent.id, type: node.parent.type };
  }
  if (isChildrenMixin(node) && !withoutRelations) {
    obj.children = node.children.map((child: any) => nodeToObject(child, withoutRelations));
  }
  if (isInstance(node) && node.mainComponent && !withoutRelations) {
    obj.mainComponent = nodeToObject(node.mainComponent, withoutRelations);
  }
  return obj as SceneNodeNoMethod;
}

// Filtering on keys: https://stackoverflow.com/a/49397693/4053349
type OmitMethods<T> = {
  [P in keyof T as T[P] extends Function ? never : P]: T[P];
};

//
// Below code is a WIP to handle hover (and variants?)
//

// TODO whitelist the fields I want to use for the diff
const diffFields = [
  'fills',
  'strokes',
  'strokeWeight',
  'strokeAlign',
  'strokeJoin',
  'dashPattern',
  'strokeCap',
  'strokeMiterLimit',
  'topLeftRadius',
  'topRightRadius',
  'bottomRightRadius',
  'bottomLeftRadius',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'opacity',
  'effects',
  'width',
  'height',
  'layoutMode',
  'layoutGrow',
  'layoutAlign',
  'primaryAxisAlignItems',
  'counterAxisAlignItems',
  'primaryAxisSizingMode',
  'counterAxisSizingMode',
  'clipsContent',
];
// relativeTransform
// rotation
// cornerSmoothing
// backgrounds
// itemSpacing
// overflowDirection

// diff: https://stackoverflow.com/questions/8572826/generic-deep-diff-between-two-objects
function addReactionDestination(obj: any) {
  for (const reaction of (obj.reactions || []) as Reaction[]) {
    if (reaction.trigger?.type === 'ON_HOVER' && reaction.action && reaction.action.type === 'NODE') {
      // TODO
      // Supposons qu'on a déjà le diff. Je peux écrire :
      // - Le résultat idéal attendu
      // - Ce qu'on en fait ensuite
      // Commencer éventuellement par une prop à la fois, pour faciliter la réflexion et l'implémentation.
    }
  }
}
