import type { TokenTypes } from '../../constants/TokenTypes.js';

export type SingleGenericToken<T extends TokenTypes, V = string, Named extends boolean = true, P = unknown> = {
  type: T;
  value: V;
  rawValue?: V;
  description?: string;
  oldDescription?: string;
  oldValue?: V;
  internal__Parent?: string;
} & (Named extends true
  ? {
      name: string;
    }
  : {
      name?: string;
    }) &
  P;
