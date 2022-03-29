import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { FlexOrTextNode, isText } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssRGBA, warnNode } from './details/utils-and-reset';

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
        const hex = figmaColorToCssRGBA(color, opacity);
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
    addStyle(styles, 'background', ...bgProps);
  }

  // If no fill, any reset required? TBC
}
