import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { TokenBoxshadowValue } from '../values';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleBoxShadowToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.BOX_SHADOW,
  TokenBoxshadowValue | TokenBoxshadowValue[],
  Named,
  P
>;
