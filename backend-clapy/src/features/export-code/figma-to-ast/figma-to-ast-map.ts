import { DeclarationPlain } from 'css-tree';

import { Dict, SceneNodeNoMethod } from '../../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from '../code.model';
import { addStyleStr } from '../css-gen/css-factories-high';

export function mapCommonStyles(context: CodeContext, node: SceneNodeNoMethod, stylesMap: Dict<DeclarationPlain>) {
  addStyleStr(stylesMap, 'display', 'flex');
  addStyleStr(stylesMap, 'flex-direction', 'row');
}

export function mapTextStyles(context: CodeContext, node: SceneNodeNoMethod, stylesMap: Dict<DeclarationPlain>) {}

export function mapTagStyles(context: CodeContext, node: SceneNodeNoMethod, stylesMap: Dict<DeclarationPlain>) {}
