import type { NodeContext } from '../code.model.js';
import { genUniqueName } from '../gen-node-utils/gen-unique-name-utils.js';
import type { BaseNode2 } from './canvas-utils.js';
import { assetsCssBaseUrl, assetsResourceDir } from './load-file-utils-and-paths.js';

export function writeAsset(context: NodeContext, node: BaseNode2, extension: string, content: string) {
  const {
    moduleContext: { projectContext },
  } = context;
  const assetName = genUniqueName(projectContext.assetsAlreadyUsed, node.name);
  const imageFileName = `${assetName}.${extension}`;

  // Write image in assets directory - the clean solution
  // projectContext.resources[`${assetsPath}/${imageFileName}`] = imageEntry.url;
  // bgImages.push(`url("../../${assetsDirName}/${imageFileName}")`);

  // Write image in public directory - the codesandbox workaround
  projectContext.resources[`${assetsResourceDir}${imageFileName}`] = content;

  const assetCssUrl = `${assetsCssBaseUrl}${imageFileName}`;
  return assetCssUrl;
}
