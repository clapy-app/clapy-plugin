import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { AnyTokenList, SingleToken } from '../tokens';
import type { UsedTokenSetsMap } from '../UsedTokenSetsMap.js';

type ShallowTokenMap = Record<string, SingleToken<false>>;
type DeepTokenMap = Record<string, Record<string, SingleToken<false>>>;
export type SetTokenDataPayload = {
  values:
    | SingleToken[]
    | Record<string, AnyTokenList>
    | Record<string, Partial<Record<TokenTypes, ShallowTokenMap | DeepTokenMap>>>;
  shouldUpdate?: boolean;
  usedTokenSet?: UsedTokenSetsMap;
};
