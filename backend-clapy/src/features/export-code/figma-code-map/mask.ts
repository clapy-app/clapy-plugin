import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function maskFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const mask = node.maskedBy;
  if (mask) {
    const { url, x, y, width, height } = mask;

    // webpackIgnore is a workaround for webpack to ignore those public paths (to work with CRA CLI)
    // - codesandbox: put assets in public folder instead of source (csb bundling doesn't process CSS url() :( )
    // - CRA CLI with the above comment to leave the public URL instead of having webpack processing it.
    // Codesandbox does not auto-add -webkit- prefix, which is required for mask-* rules. So we manually add them.
    addStyle(context, node, styles, '-webkit-mask-image', `/* webpackIgnore: true */ url("${url}")`);
    addStyle(context, node, styles, 'mask-image', `/* webpackIgnore: true */ url("${url}")`);

    // TODO in 4-figma-to-ast-root.ts if we need to calculate a more accurate x/y.
    // Test with borders, padding, scale mode for left in %...
    const dx = x - node.x;
    const dy = y - node.y;
    addStyle(context, node, styles, '-webkit-mask-repeat', `no-repeat`);
    addStyle(context, node, styles, 'mask-repeat', `no-repeat`);
    addStyle(context, node, styles, '-webkit-mask-position', `${dx}px ${dy}px`);
    addStyle(context, node, styles, 'mask-position', `${dx}px ${dy}px`);
    addStyle(context, node, styles, '-webkit-mask-size', `${width}px ${height}px`);
    addStyle(context, node, styles, 'mask-size', `${width}px ${height}px`);
  }
}
