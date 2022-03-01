import { _Routes, _Subscriptions } from '../backend/routes';
import { ArgTypes } from '../backend/routes/import-sb/sb-serialize.model';

export type Dict2<Key extends string | number | symbol, Value> = {
  [key in Key]: Value;
};

export type Nil = null | undefined;

// Can be read from both client and server. It shares the controller model to help typing the client code.
export type Routes = _Routes;

export type RequestMessage<T = any> = { type: keyof Routes; payload: T[]; noResponse?: boolean };
export type ResponseMessage<T = any> = { type: keyof Routes; payload: T };
export type ResponseMessageError = { type: keyof Routes; error: any };

export type Subscriptions = _Subscriptions;
export type NextFn<T> = (value: T) => void;
export type NextMessage<T = any> = { type: keyof Subscriptions; payload: T };

export interface SbOtherSelection {
  figmaId: string;
  pageId: string;

  storyId?: undefined;
  storyLabel?: undefined;
  storyUrl?: undefined;
  tagFigmaId?: undefined;
}

export interface SbCompSelection {
  figmaId: string;
  pageId: string;

  storyId: string;
  storyLabel: string;
  storyUrl: string;
  argTypes: ArgTypes;
  tagFigmaId: string;
  // sbUrl - base URL, if required?
}

export type SbAnySelection = SbCompSelection | SbOtherSelection;
