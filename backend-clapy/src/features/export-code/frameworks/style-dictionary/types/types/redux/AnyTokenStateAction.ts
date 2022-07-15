import type { RootModel } from '../RootModel.js';
import type { ActionMeta } from './ActionMeta.js';

export type AnyTokenStateAction<GlobalScope = false> = {
  [K in keyof RootModel['tokenState']['reducers']]: {
    type: GlobalScope extends true ? any /* `tokenState/${K}` */ : K;
    payload: Parameters<RootModel['tokenState']['reducers'][K]>[1];
    meta?: ActionMeta;
  };
}[/* keyof RootModel['tokenState']['reducers'] */ any];
