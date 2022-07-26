import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleFontWeightsToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.FONT_WEIGHTS,
  string,
  Named,
  P
>;
