import type { _Routes, _Subscriptions } from '../backend/routes';
import type { extractionStepsLabels } from './app-config.js';
import type { Args, ArgTypes, PageConfig } from './sb-serialize.model';

export type ObjKey = string | number | symbol;

export type Dict2<Key extends ObjKey, Value> = {
  [key in Key]: Value;
};

export type Nil = null | undefined;
export declare type UnwrapPromiseLike<T> = T extends PromiseLike<infer U> ? U : T;

// Can be read from both client and server. It shares the controller model to help typing the client code.
export type Routes = _Routes;

export type RequestMessage<T = any> = { __id: string; type: keyof Routes; payload: T[]; noResponse?: boolean };
export type ResponseMessage<T = any> = { __id: string; type: keyof Routes; payload: T };
export type ResponseMessageError = { __id: string; type: keyof Routes; error: any };

export type Subscriptions = _Subscriptions;
export type NextFn<T> = (value: T) => void;
export type NextMessage<T = any> = { type: keyof Subscriptions; payload: T };

export interface SbOtherSelection {
  figmaId: string;
  pageId: string;

  storyId?: undefined;
  storyLabel?: undefined;
  sbUrl?: undefined;
  storyUrl?: undefined;
  argTypes?: undefined;
  initialArgs?: undefined;
  tagFigmaId?: undefined;
  props?: undefined;
}

export interface SbCompSelection {
  figmaId: string;
  pageId: string;

  storyId: string;
  storyLabel: string;
  sbUrl: string;
  storyUrl: string;
  argTypes: ArgTypes;
  initialArgs: Args;
  tagFigmaId: string;
  props: ArgTypeUsed[] | undefined;
  // sbUrl - base URL, if required?
}

export type SbAnySelection = SbCompSelection | SbOtherSelection;

export interface ArgTypeUsed {
  argName: string;
  // argType: ArgType;
  used: boolean;
}

export interface ArgTypeObj {
  [argName: string]: boolean;
}

export interface NewVariant {
  i: number;
  j: number;
  args: Args;
}

export interface ExtractionProgress {
  stepId: keyof typeof extractionStepsLabels; // Map to the text of the step
  stepNumber: number;
  nodeName?: string;
}

export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  /** @deprecated */
  companyName?: string;
  phone?: string;
  jobRole?: string;
  techTeamSize?: string;
  email?: string;
  picture?: string;
  usage?: UserMetaUsage;
  licenceStartDate?: number;
  licenceExpirationDate?: number;
  quotas?: number;
  quotasMax?: number;
  isLicenseExpired?: boolean;
  limitedUser?: boolean;

  // UI-only field
  phoneIsValid?: boolean;
}

export interface UserMetaUsage {
  components?: boolean;
  designSystem?: boolean;
  landingPages?: boolean;
  other?: boolean;
  otherDetail?: string;
}

export type UserProfileState = UserMetadata | true | undefined;

export interface PreviewResp {
  preview: string | false | undefined;
  page: PageConfig;
}

export interface GithubCredentials {
  accessToken: string | undefined;
  user: string | undefined;
  hasPermission: boolean;
}

export interface GithubCredentialsDef {
  // same as GithubCredentials, but all defined
  accessToken: string;
  user: string;
  hasPermission: boolean;
}
