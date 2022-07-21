import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { TokenTextCaseValue } from '../values';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleTextCaseToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.TEXT_CASE,
  TokenTextCaseValue,
  Named,
  P
>;
