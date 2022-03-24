import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { mkDeclarationCss, mkDimensionCss, mkIdentifierCss, mkValueCss } from './css-factories-low';

export function addStyleStr(stylesMap: Dict<DeclarationPlain>, name: string, value: string) {
  stylesMap[name] = mkDeclarationCss(name, mkValueCss([mkIdentifierCss(value)]));
}

export function addStyleDim(stylesMap: Dict<DeclarationPlain>, name: string, value: number, unit: string) {
  stylesMap[name] = mkDeclarationCss(name, mkValueCss([mkDimensionCss(value.toString(), unit)]));
}
