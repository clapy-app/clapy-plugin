import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from '../code.model';
import { FlexNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssRGBA, warnNode } from './_utils-and-reset';

export function backgroundFigmaToCode(context: CodeContext, node: FlexNode, stylesMap: Dict<DeclarationPlain>) {
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
        warnNode(node, 'Unsupported non solid background (TODO)');
      }
    }
    addStyle(stylesMap, 'background', ...bgProps);
  }

  // If no fill, any reset required? TBC
}
