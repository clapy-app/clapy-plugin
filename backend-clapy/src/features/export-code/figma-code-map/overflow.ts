import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { FlexOrTextNode } from '../create-ts-compiler/canvas-utils';
import { guessOverflow } from '../smart-guesses/guessOverflow';

export function overflowFigmaToCode(context: NodeContext, node: FlexOrTextNode, styles: Dict<DeclarationPlain>) {
  guessOverflow(context, node, styles);
}
