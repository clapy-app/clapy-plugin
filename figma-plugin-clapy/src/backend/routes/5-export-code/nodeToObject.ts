import { baseBlacklist, SceneNodeNoMethod } from '../../../common/sb-serialize.model';
import { isChildrenMixin, isFrame, isInstance, isShape, isText } from '../../common/node-type-utils';
import { utf8ArrayToStr } from './Utf8ArrayToStr';

// Extracted from Figma typings
type RangeProp = keyof Omit<StyledTextSegment, 'characters' | 'start' | 'end'>;

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
];
/* as Writeable<typeof rangeProps> */
const blacklist = new Set<string>(baseBlacklist);
const textBlacklist = new Set<string>([...baseBlacklist, ...rangeProps, 'characters']);

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

interface Options {
  skipChildren?: boolean;
  skipParent?: boolean;
  skipInstance?: boolean;
}

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
 * @param options
 */
export async function nodeToObject<T extends SceneNode>(node: T, options: Options = {}) {
  const { skipChildren = false, skipParent = true, skipInstance = true } = options;
  let exportAsSvg = false;
  let obj: any;
  if (containsShapesOnly(node)) {
    exportAsSvg = true;
  }
  const props = Object.entries(Object.getOwnPropertyDescriptors((node as any).__proto__));
  obj = { id: node.id, type: node.type };
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

  const nodeIsShape = isShape(node);
  if (nodeIsShape || exportAsSvg) {
    obj.type = 'VECTOR' as typeof node.type;
    if (nodeIsShape) {
      node.effects = [];
      node.effectStyleId = '';
    }

    // TextDecoder is undefined, I don't know why. We are supposed to be in a modern JS engine. So we use a JS replacement instead.
    // But ideally, we should do:
    // obj._svg = new TextDecoder().decode(await node.exportAsync({ format: 'SVG' }));
    obj._svg = utf8ArrayToStr(await node.exportAsync({ format: 'SVG' }));
  }
  if (node.parent && !skipParent) {
    obj.parent = { id: node.parent.id, type: node.parent.type };
  }
  if (isChildrenMixin(node) && !exportAsSvg && !skipChildren) {
    obj.children = await Promise.all(node.children.map((child: any) => nodeToObject(child, options)));
  }
  if (isInstance(node) && node.mainComponent && !skipInstance) {
    obj.mainComponent = nodeToObject(node.mainComponent, options);
  }
  return obj as SceneNodeNoMethod;
}

function containsShapesOnly(node: SceneNode) {
  if (!isFrame(node)) return false;
  for (const child of node.children) {
    if (!isShape(child)) {
      return false;
    }
  }
  return true;
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
