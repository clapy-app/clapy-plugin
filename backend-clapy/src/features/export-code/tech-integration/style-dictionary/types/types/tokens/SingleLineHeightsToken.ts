import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleLineHeightsToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.LINE_HEIGHTS,
  string,
  Named,
  P
>;
