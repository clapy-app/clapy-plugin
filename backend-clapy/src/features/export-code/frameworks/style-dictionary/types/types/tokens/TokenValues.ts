import type { AnyTokenList } from './AnyTokenList.js';

export type TokenValues = {
  // @README these could be different themes or sets of tokens
  values: Record<string, AnyTokenList>;
};
