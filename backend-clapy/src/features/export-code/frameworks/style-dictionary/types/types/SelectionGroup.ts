import type { TokenTypes } from '../constants/TokenTypes.js';
import type { NodeInfo } from './NodeInfo.js';
import type { SelectionValue } from './SelectionValue.js';

export interface SelectionGroup {
  category: TokenTypes;
  type: SelectionValue;
  value: string;
  nodes: NodeInfo[];
}
