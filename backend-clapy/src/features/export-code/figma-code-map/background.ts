import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { FlexOrTextNode, isText } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssHex, warnNode } from './details/utils-and-reset';

export function backgroundFigmaToCode(context: NodeContext, node: FlexOrTextNode, styles: Dict<DeclarationPlain>) {
  // Text color is handled separately (color.ts)
  if (isText(node)) return;

  const visibleFills = (Array.isArray(node.fills) ? (node.fills as Paint[]) : []).filter(({ visible }) => visible);
  if (visibleFills.length) {
    const bgProps = [];
    let first = true;
    for (const fill of visibleFills) {
      if (fill.type === 'SOLID') {
        // fill.blendMode
        const { color, opacity } = fill;
        const hex = figmaColorToCssHex(color, opacity);
        bgProps.push(hex);
        if (first) {
          first = false;
        } else {
          bgProps.push(',');
        }
      } else {
        warnNode(node, 'TODO Unsupported non solid background');
      }
    }
    if (bgProps.length) {
      addStyle(styles, 'background', ...bgProps);
      return;
    }
  }
}
