import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleBorderWidthToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.BORDER_WIDTH,
  string,
  Named,
  P
>;
