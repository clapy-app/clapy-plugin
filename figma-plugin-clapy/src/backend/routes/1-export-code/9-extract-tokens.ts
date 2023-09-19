import { handleErrorBack, warnNode } from '../../../common/error-utils';
import type { Dict } from '../../../common/sb-serialize.model';
import { isPage } from '../../common/node-type-utils';

const enableFigmaTokens = true;

// TODO better typing
type TokenName = string;

// const globalTokenKeys = ['version', 'usedTokenSet', 'updatedAt', 'values'];

function tokenOf(node: SceneNode | PageNode | DocumentNode, name: string, parseAsJSON = false) {
  const value = node.getSharedPluginData('tokens', name);
  try {
    return value && parseAsJSON ? JSON.parse(value) : value;
  } catch (error) {
    warnNode(node, `Failed to parse as JSON the token ${name} with value ${value}`);
    return value;
  }
}

export function extractFigmaTokens() {
  if (!enableFigmaTokens) return;

  try {
    let values = tokenOf(figma.root, 'values', true);
    const usedTokenSet = tokenOf(figma.root, 'usedTokenSet', true);
    if (usedTokenSet) {
      values = Object.fromEntries(Object.entries(values).filter(([key, _]) => usedTokenSet[key] !== 'disabled'));
    }
    return {
      version: tokenOf(figma.root, 'version', true),
      usedTokenSet,
      updatedAt: tokenOf(figma.root, 'updatedAt'),
      values,
    };
  } catch (error) {
    handleErrorBack(error);
    return undefined;
  }
}

export function exportNodeTokens(node: SceneNode | PageNode) {
  try {
    if (isPage(node)) return;
    return node.getSharedPluginDataKeys('tokens').reduce((obj, key) => {
      if (!obj) obj = {};
      // obj[key] = JSON.stringify(node.getSharedPluginData('tokens', key));
      obj[key] = tokenOf(node, key, key !== 'hash');
      return obj;
    }, undefined as Dict<TokenName> | undefined);
  } catch (error) {
    handleErrorBack(error);
    warnNode(node, 'while processing this node');
    // throw error;
    return undefined;
  }
}

export function exportNodeTokens2(node: SceneNode) {
  try {
    return node.getSharedPluginDataKeys('tokens').reduce((obj, key) => {
      if (!obj) obj = {};
      // obj[key] = JSON.stringify(node.getSharedPluginData('tokens', key));
      obj[key] = tokenOf(node, key, key !== 'hash');
      return obj;
    }, undefined as Dict<TokenName> | undefined);
  } catch (error) {
    handleErrorBack(error);
    warnNode(node, 'while processing this node');
    // throw error;
    return undefined;
  }
}
