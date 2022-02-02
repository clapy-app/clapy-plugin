import { _Routes, _Subscriptions } from '../backend/routes';

export interface Dict<T> {
  [key: string]: T;
}

// Can be read from both client and server. It shares the controller model to help typing the client code.
export type Routes = _Routes;

export type RequestMessage<T = any> = { type: keyof Routes, payload: T[], noResponse?: boolean; };
export type ResponseMessage<T = any> = { type: keyof Routes, payload: T; };
export type ResponseMessageError = { type: keyof Routes, error: any; };

export type Subscriptions = _Subscriptions;
export type NextFn<T> = (value: T) => void;
export type NextMessage<T = any> = { type: keyof Subscriptions, payload: T; };

export interface SbCompSelection {
  id?: string;
  name?: string;
  url?: string;
  // sbUrl if required?
  figmaId: string;
}
