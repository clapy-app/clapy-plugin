import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { TokenTypograpyValue } from '../values';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleTypographyToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.TYPOGRAPHY,
  TokenTypograpyValue,
  Named,
  P
>;
