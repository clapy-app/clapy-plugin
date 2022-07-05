import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleSizingToken = SingleGenericToken<TokenTypes.SIZING, string>;
