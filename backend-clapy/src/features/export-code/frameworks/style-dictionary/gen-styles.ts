import { isPlainObject } from 'lodash';
import StyleDictionary, { Core } from 'style-dictionary';
import { DesignToken, DesignTokens } from 'style-dictionary/types/DesignToken';

import { Dict } from '../../../sb-serialize-preview/sb-serialize.model';
import { MySingleToken } from '../../code.model';
import { getStyleDictionaryConfig, postTransforms } from './style-dictionary-config';
import { TokenStore } from './types/types/tokens';

const transformConfig = require('style-dictionary/lib/transform/config');
const createDictionary = require('style-dictionary/lib/utils/createDictionary');
const filterProperties = require('style-dictionary/lib/filterProperties');
const createFormatArgs = require('style-dictionary/lib/utils/createFormatArgs');
const transformProperty = require('style-dictionary/lib/transform/property');

export function genStyles(tokens: TokenStore | undefined) {
  if (!tokens) return {};

  const [tokens2, tokensRawMap] = unserializeTokens(tokens.values);

  const sd = StyleDictionary.extend(getStyleDictionaryConfig(tokens2));
  const { varNamesMap, cssVarsDeclaration } = buildStyles(sd);
  return { varNamesMap, cssVarsDeclaration, tokensRawMap } as const;
}

function unserializeTokens(tokenStoreValues: TokenStore['values']) {
  const tokens: DesignTokens = {};
  const tokensRawMap: Dict<MySingleToken> = {};
  for (const [setName, tokensList] of Object.entries(tokenStoreValues)) {
    for (const { name, type, value } of tokensList) {
      assignWithDotNotation(tokens, name, { value, type });
      tokensRawMap[name] = { type, value };
    }
  }
  return [tokens, tokensRawMap] as const;
}

function assignWithDotNotation(object: any, keyWithDots: string, token: DesignToken) {
  // Split by dot and assign to sub-objects following the dot notation
  const fragments = keyWithDots.split('.');
  let obj = object;
  for (let i = 0; i < fragments.length - 1; i++) {
    const fragment = fragments[i];
    if (!obj[fragment]) {
      obj[fragment] = {};
    }
    obj = obj[fragment];
  }
  const key = fragments[fragments.length - 1];

  // Once we have the last object and key, there is a special case: if token.value is a sub-object or array
  if (typeof token.value === 'string' || Array.isArray(token.value)) {
    obj[key] = token;
  } else if (typeof token.value !== 'object') {
    throw new Error(`Unsupported token value: ${JSON.stringify(token.value)}`);
  } else {
    obj[key] = {};
    Object.assign(obj[key], wrapTokenValueLeaf(token.value));
  }
}

// e.g. replace { x: '3' } with { x: { value: '3', type: 'x' } }
function wrapTokenValueLeaf(obj: any) {
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'object') {
      wrapTokenValueLeaf(value);
    } else {
      obj[key] = { type: key, value };
    }
  }
  return obj;
}

function buildStyles(sd: Core) {
  const platforms = Object.keys(sd.options.platforms);

  if (platforms.length !== 1) throw new Error('There should be exactly one platform. More is not handled yet.');

  const platform = platforms[0];

  return buildPlatform(sd, platform);
}

function buildPlatform(sd: Core, platform: string) {
  if (!sd.options || !(platform in (sd.options.platforms || {}))) {
    throw new Error(`Platform "${platform}" does not exist`);
  }

  let properties: StyleDictionary.TransformedTokens;
  // We don't want to mutate the original object
  const platformConfig: StyleDictionary.Platform = transformConfig(sd.options.platforms[platform], sd, platform);

  // We need to transform the object before we resolve the
  // variable names because if a value contains concatenated
  // values like "1px solid {color.border.base}" we want to
  // transform the original value (color.border.base) before
  // replacing that value in the string.
  properties = sd.exportPlatform(platform);

  // -- Clapy addition
  applyPostTransform(platformConfig, properties);
  const varNamesMap = indexVarNames(properties);

  // This is the dictionary object we pass to the file
  // building and action methods.
  const dictionary: StyleDictionary.Dictionary = createDictionary({ properties });

  if (!platformConfig.files) throw new Error('files is required in the config.');
  if (platformConfig.files.length !== 1) throw new Error('There should be exactly one file. More is not handled yet.');

  const file = platformConfig.files[0];
  if (!file.format) {
    throw new Error('Please supply a format');
  }

  const cssVarsDeclaration = buildFile(file, platformConfig, dictionary);
  return { varNamesMap, cssVarsDeclaration } as const;
}

type PostTransformEntry =
  | StyleDictionary.TransformedToken
  | Array<PostTransformEntry>
  | StyleDictionary.TransformedTokens;

function applyPostTransform(platformConfig: StyleDictionary.Platform, entry: PostTransformEntry) {
  if (Array.isArray(entry)) {
    for (const e of entry) {
      applyPostTransform(platformConfig, e);
      return;
    }
  }
  if (!isPlainObject(entry)) {
    throw new Error(`Not a valid entry to apply post-transformation: ${JSON.stringify(entry)}`);
  }
  for (const [propName, prop] of Object.entries(entry)) {
    if (isPTEntryLeaf(prop)) {
      (platformConfig as any).transforms = postTransforms;
      (entry as any)[propName] = transformProperty(prop, platformConfig);
    } else {
      applyPostTransform(platformConfig, prop);
    }
  }
}

function isPTEntryLeaf(entry: PostTransformEntry): entry is StyleDictionary.TransformedToken {
  const e = entry as StyleDictionary.TransformedToken;
  return !!e.value && e.type && !isPlainObject(e.value);
}

function indexVarNames(properties: StyleDictionary.TransformedTokens) {
  return _indexVarNames({}, properties, '');
}

function _indexVarNames(index: Dict<string>, properties: StyleDictionary.TransformedTokens, key: string) {
  for (const [fragmentName, val] of Object.entries(properties)) {
    const fullKey = key ? `${key}.${fragmentName}` : fragmentName;
    if (typeof val.name === 'string') {
      // It's a leaf, ready to add to the index
      index[fullKey] = val.name;
    } else {
      _indexVarNames(index, val, fullKey);
    }
  }
  return index;
}

function buildFile(
  file: StyleDictionary.File,
  platform: StyleDictionary.Platform,
  dictionary: StyleDictionary.Dictionary,
) {
  var { destination, filter, format: f } = file || {};
  let format = f as Function /* & { nested: boolean } */ | string;

  if (typeof format !== 'function') throw new Error('Please enter a valid file format');
  if (typeof destination !== 'string') throw new Error('Please enter a valid destination');

  // get if the format is nested, this needs to be done before
  // the function is bound
  // const nested = format.nested;
  // to maintain backwards compatibility we bind the format to the file object
  format = format.bind(file) as Function;
  var fullDestination = destination;

  // if there is a build path, prepend the full destination with it
  if (platform.buildPath) {
    fullDestination = platform.buildPath + fullDestination;
  }

  // var dirname = path.dirname(fullDestination);
  // if (!fs.existsSync(dirname)) fs.mkdirsSync(dirname);

  const filteredProperties: StyleDictionary.Dictionary = filterProperties(dictionary, filter);
  const filteredDictionary = Object.assign({}, dictionary, {
    properties: filteredProperties.properties,
    allProperties: filteredProperties.allProperties,
    tokens: filteredProperties.properties,
    allTokens: filteredProperties.allProperties,
    // keep the unfiltered properties object for reference resolution
    _properties: dictionary.properties,
  });

  // if properties object is empty, return without creating a file
  if (
    filteredProperties.hasOwnProperty('properties') &&
    Object.keys(filteredProperties.properties).length === 0 &&
    filteredProperties.properties.constructor === Object
  ) {
    let warnNoFile = `No properties for ${destination}. File not created.`;
    console.log(warnNoFile);
    // console.log(chalk.keyword('darkorange')(warnNoFile));
    return null;
  }

  // Check for property name Collisions
  var nameCollisionObj: Dict<StyleDictionary.TransformedToken[]> = {};
  filteredProperties.allProperties &&
    filteredProperties.allProperties.forEach(propertyData => {
      let propertyName = propertyData.name;
      if (!nameCollisionObj[propertyName]) {
        nameCollisionObj[propertyName] = [];
      }
      nameCollisionObj[propertyName].push(propertyData);
    });

  // format => customFormat
  return format(
    createFormatArgs({
      dictionary: filteredDictionary,
      platform,
      file,
    }),
    platform,
    file,
  ) as string;
}
