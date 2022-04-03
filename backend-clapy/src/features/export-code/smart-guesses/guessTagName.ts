import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { Dict, FrameNodeNoMethod, SceneNodeNoMethod } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isFlexNode, isText } from '../create-ts-compiler/canvas-utils';
import { addHugContents, defaultNode, makeDefaultNode } from '../figma-code-map/details/default-node';
import { mkInputTypeAttr } from '../figma-code-map/details/ts-ast-utils';

const { factory } = ts;

export function guessTagNameAndUpdateNode(
  context: NodeContext,
  node: SceneNodeNoMethod,
  styles: Dict<DeclarationPlain>,
) {
  const name = context.nodeNameLower;
  const extraAttributes: ts.JsxAttribute[] = [];
  if (
    !context.componentContext.inInteractiveElement &&
    isFlexNode(node) &&
    ((Array.isArray(node.fills) && node.fills.length >= 1) || node.strokes.length >= 1 || node.effects.length >= 1) &&
    (name === 'button' || (name.includes('button') && !name.includes('wrapper') && !name.includes('group')))
  ) {
    context.componentContext = { ...context.componentContext, inInteractiveElement: true };
    context.tagName = 'button';
  } else if (
    !context.componentContext.inInteractiveElement &&
    isFlexNode(node) &&
    ((Array.isArray(node.fills) && node.fills.length >= 1) || node.strokes.length >= 1 || node.effects.length >= 1) &&
    (name === 'checkbox' || (name.includes('checkbox') && !name.includes('wrapper') && !name.includes('group')))
  ) {
    // TODO Smart guess on input parent, if contains "label", turn it into a <label>. Tip:
    // function isInput() {}
    // function isCheckbox() {}

    if (context.parentNode && context.parentContext?.tagName !== 'label') {
      const siblings = context.parentNode.children;
      const i = siblings.indexOf(node);
      if (i !== -1) {
        const nextSibling = siblings[i + 1];
        // Condition to wrap the checkbox into a <label>: if one of them is true:
        // - Exactly 2 siblings, the first being the checkbox and the second text
        // - More than 2 siblings, and the sibling right after the checkbox is a text with name including "label"
        const shouldWrapInLabel =
          isText(nextSibling) && (siblings.length === 2 || nextSibling.name.toLowerCase().includes('label'));
        if (shouldWrapInLabel) {
          const overrides: Partial<FrameNodeNoMethod> = {
            children: [node, nextSibling],
            itemSpacing: node.itemSpacing,
          };
          if (defaultNode.layoutMode !== 'HORIZONTAL') {
            overrides.layoutMode = 'HORIZONTAL';
          }
          node = makeDefaultNode('input label', overrides, addHugContents());
          context.tagName = 'label';
          (siblings as SceneNode[]).splice(i, 2, node as SceneNode);
          return [node, extraAttributes] as const;
        }
      }
    }
    context.componentContext = { ...context.componentContext, inInteractiveElement: true };
    context.tagName = 'input';
    extraAttributes.push(mkInputTypeAttr('checkbox'));
    // Padding has no effect on checkboxes (Windows). Let's disable it and replace with width.
    node.paddingTop = 0;
    node.paddingRight = 0;
    node.paddingBottom = 0;
    node.paddingLeft = 0;
  } else {
    // Keep the default tag name
  }
  return [node, extraAttributes] as const;
}
