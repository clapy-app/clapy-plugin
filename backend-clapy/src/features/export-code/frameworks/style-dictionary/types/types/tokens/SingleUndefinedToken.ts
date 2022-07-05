import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleUndefinedToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.UNDEFINED,
  string,
  Named,
  P
>;
