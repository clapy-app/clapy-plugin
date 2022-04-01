import { DeclarationPlain } from 'css-tree';

import { flags } from '../../../env-and-config/app-config';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { FlexOrTextNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { tagResets } from './details/utils-and-reset';

export function borderBoxFigmaToCode(context: NodeContext, node: FlexOrTextNode, styles: Dict<DeclarationPlain>) {
  if (!flags.useCssBorderBox && tagResets[context.tagName]?.boxSizingContent) {
    addStyle(styles, 'box-sizing', 'content-box');
  }
}
