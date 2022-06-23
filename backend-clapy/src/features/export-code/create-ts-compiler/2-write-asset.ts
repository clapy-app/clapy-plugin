import { NodeContext } from '../code.model';
import { genUniqueName } from '../gen-node-utils/ts-ast-utils';
import { BaseNode2 } from './canvas-utils';
import { assetsCssBaseUrl, assetsResourceDir } from './load-file-utils-and-paths';

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
