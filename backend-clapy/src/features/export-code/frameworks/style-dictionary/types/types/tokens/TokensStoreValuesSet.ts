import type { AnyTokenList } from './AnyTokenList.js';
import type { AnyTokenSet } from './AnyTokenSet.js';

// @TODO not sure what this should be / where this is to be used
export type TokensStoreValuesSet =
  | {
      type: 'array';
      values: AnyTokenList;
    }
  | {
      type: 'object';
      values: AnyTokenSet;
    };
