// import { RootModel } from '../RootModel.js';
// import { ActionMeta } from './ActionMeta.js';

export type AnyInspectStateAction<GlobalScope = false> = /* {
  [K in keyof RootModel['inspectState']['reducers']]: {
    type: GlobalScope extends true ? `inspectState/${K}` : K;
    payload: Parameters<RootModel['inspectState']['reducers'][K]>[1];
    meta?: ActionMeta;
  };
}[keyof RootModel['inspectState']['reducers']] */ any;
