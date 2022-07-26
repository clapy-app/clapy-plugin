import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

// @TODO remove implicit type token if not used anymore
export type SingleImplicitToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.IMPLICIT,
  string,
  Named,
  P
>;
