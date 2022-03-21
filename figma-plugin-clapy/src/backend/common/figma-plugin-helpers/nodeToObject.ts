import { SceneNodeNoMethod } from '../../../common/sb-serialize.model';
import { isChildrenMixin, isInstance } from '../canvas-utils';

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
  const blacklist = ['parent', 'children', 'removed', 'masterComponent'];
  const obj: any = { id: node.id, type: node.type };
  for (const [name, prop] of props) {
    if (prop.get && !blacklist.includes(name)) {
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
