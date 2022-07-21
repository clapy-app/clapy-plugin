import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleBorderRadiusToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.BORDER_RADIUS,
  string,
  Named,
  P
>;
