import { Block, BlockPlain, Declaration, DeclarationPlain, List } from 'css-tree';

import { Dict, SceneNodeNoMethod } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContextWithBorders } from '../code.model';
import { isValidNode } from '../create-ts-compiler/canvas-utils';
import { csstree } from '../create-ts-compiler/csstree';
import { positionAbsoluteFigmaToCode } from '../figma-code-map/position-absolute';
import { isDeclarationListOrThrow, isRootRule, isRule, isStyleSheet } from './css-type-utils';

export function addRulesToAppCss(appCss: string, parentNode: SceneNodeNoMethod) {
  if (!isValidNode(parentNode)) {
    console.warn('Parent node is not valid to add CSS rules in App.module.css', parentNode);
    return;
  }
  const styles: Dict<DeclarationPlain> = {};
  const context = {} as NodeContextWithBorders;
  positionAbsoluteFigmaToCode(context, parentNode, styles);

  const node = csstree.parse(appCss);
  if (!isStyleSheet(node)) {
    console.warn('Not a stylesheet', node);
    return;
  }
  for (const child of node.children.toArray()) {
    if (isRule(child) && isRootRule(child) && isDeclarationListOrThrow(child.block.children)) {
      const block: BlockPlain = {
        type: 'Block',
        children: Object.values(styles),
      };
      const block2 = csstree.fromPlainObject(block) as Block;
      child.block.children.appendList(block2.children as List<Declaration>);
    }
  }
  return csstree.generate(node);
}
