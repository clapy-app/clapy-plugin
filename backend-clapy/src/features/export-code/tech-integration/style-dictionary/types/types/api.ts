export type StorageType = {
  provider: StorageProviderType;
  id?: string;
  name?: string;
  filePath?: string;
  branch?: string;
};

export type ApiDataType = {
  id: string;
  secret: string;
  provider: StorageProviderType;
  name: string;
  branch?: string;
  new?: boolean;
};

export enum StorageProviderType {
  LOCAL = 'local',
  JSONBIN = 'jsonbin',
  GITHUB = 'github',
  URL = 'url',
}

export interface ContextObject extends ApiDataType {
  branch: string;
  filePath: string;
  tokens?: string;
  baseUrl?: string;
  internalId?: string;
}

export interface StoredCredentials {
  id: string;
  provider: StorageProviderType;
  filePath?: string;
  branch?: string;
  name?: string;
}
