import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

// @TODO remove text type token if not used anymore
export type SingleTextToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.TEXT,
  string,
  Named,
  P
>;
