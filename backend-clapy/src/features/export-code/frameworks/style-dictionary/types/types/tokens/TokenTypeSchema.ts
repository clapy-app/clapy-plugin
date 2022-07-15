import type { TokenTypes } from '../../constants/TokenTypes.js';
import type { DeepKeyTokenMap } from './DeepKeyTokenMap.js';
import type { SingleToken } from './SingleToken.js';

export type TokenTypeSchema = {
  label: string;
  property: string;
  type: TokenTypes;
  explainer?: string;
  help?: string;
  schema: {
    value?: SingleToken['value'];
    options?: {
      description?: string;
    };
  };
  values?: DeepKeyTokenMap;
};
