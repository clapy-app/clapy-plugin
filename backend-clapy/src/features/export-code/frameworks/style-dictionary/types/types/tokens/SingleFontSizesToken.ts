import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleFontSizesToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.FONT_SIZES,
  string,
  Named,
  P
>;
