import type { RootModel } from '../RootModel.js';
import type { ActionMeta } from './ActionMeta.js';

export type AnyUiStateAction<GlobalScope = false> = {
  [K in keyof RootModel['uiState']['reducers']]: {
    type: GlobalScope extends true ? any /* `uiState/${K}` */ : K;
    payload: Parameters<RootModel['uiState']['reducers'][K]>[1];
    meta?: ActionMeta;
  };
}[/* keyof RootModel['uiState']['reducers'] */ any];
