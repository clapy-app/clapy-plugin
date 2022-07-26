import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleOpacityToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.OPACITY,
  string,
  Named,
  P
>;
