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
