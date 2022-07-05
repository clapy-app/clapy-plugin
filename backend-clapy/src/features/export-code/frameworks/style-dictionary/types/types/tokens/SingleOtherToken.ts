import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleOtherToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.OTHER,
  string,
  Named,
  P
>;
