import type { UsedTokenSetsMap } from '../UsedTokenSetsMap.js';
import type { AnyTokenList } from './AnyTokenList.js';

export type TokenStore = {
  version: string;
  updatedAt: string;
  // @README these could be different themes or sets of tokens
  values: Record<string, AnyTokenList>;
  usedTokenSet?: UsedTokenSetsMap | null;
};
