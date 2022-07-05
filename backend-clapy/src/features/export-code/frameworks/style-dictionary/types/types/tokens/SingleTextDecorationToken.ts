import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { TokenTextDecorationValue } from '../values';
import type { SingleGenericToken } from './SingleGenericToken.js';

export type SingleTextDecorationToken<Named extends boolean = true, P = unknown> = SingleGenericToken<
  TokenTypes.TEXT_DECORATION,
  TokenTextDecorationValue,
  Named,
  P
>;
