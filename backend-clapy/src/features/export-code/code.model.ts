import { DeclarationPlain } from 'css-tree';

import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { CssRootNode } from './css-gen/css-factories-low';

export type CsbDict = Dict<{ content: string }>;
export type CodeDict = Dict<string>;

export interface CodeContext {
  cssRules: CssRootNode[];
  classNamesAlreadyUsed: Set<string>;
  inButton?: boolean;
  parentStylesMap?: Dict<DeclarationPlain>;
}
