import type { CtrlRoutes } from '../plugin/controller';

export interface Dict<T> {
  [key: string]: T;
}

// Can be read from both client and server. It shares the controller model to help typing the client code.
export type Routes = CtrlRoutes;