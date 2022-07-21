import { Properties } from './Properties.js';
import { SharedPluginDataNamespaces } from './SharedPluginDataNamespaces.js';

export const SharedPluginDataKeys = Object.freeze({
  [SharedPluginDataNamespaces.TOKENS]: {
    version: 'version',
    values: 'values',
    updatedAt: 'updatedAt',
    storageType: 'storageType',
    hash: 'hash',
    persistentNodesCache: 'persistentNodesCache',
    usedTokenSet: 'usedTokenSet',
    ...Properties,
  },
});
