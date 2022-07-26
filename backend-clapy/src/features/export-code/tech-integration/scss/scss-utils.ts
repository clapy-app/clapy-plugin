import { basename } from 'path';

import type { ExtraConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict, ProjectContext } from '../../code.model.js';
import type { FrameworkConnector } from '../../frameworks/framework-connectors.js';

const scssDevDependencies = {
  sass: '^1.53.0',
};

export function addScssPackage(projectContext: ProjectContext) {
  const { extraConfig, newDevDependencies } = projectContext;
  if (extraConfig.scss) {
    Object.assign(newDevDependencies, scssDevDependencies);
  }
}

export function getCSSExtension(extraConfig: ExtraConfig) {
  return extraConfig.scss ? 'scss' : 'css';
}

export function updateFilesAndContentForScss(
  fwConnector: FrameworkConnector,
  extraConfig: ExtraConfig,
  tsFiles: CodeDict,
  cssFiles: CodeDict,
  resources: CodeDict,
) {
  if (extraConfig.scss) {
    replaceScssReferences(tsFiles, cssFiles, resources);
    renameTemplateSCSSFiles(cssFiles);
    fwConnector.patchSCSSInFileContents(resources, extraConfig);
  }
}

function renameTemplateSCSSFiles(cssFiles: CodeDict) {
  for (const [filePath, content] of Object.entries(cssFiles)) {
    if (filePath.endsWith('.css')) {
      delete cssFiles[filePath];
      cssFiles[cssToScss(filePath)] = content;
    } else {
      throw new Error(`Non-CSS file received in renameTemplateSCSSFiles: ${filePath}`);
    }
  }
}

function cssToScss(fileNameOrPath: string) {
  return `${fileNameOrPath.slice(0, -3)}scss`;
}

function replaceScssReferences(tsFiles: CodeDict, cssFiles: CodeDict, resources: CodeDict) {
  const fileNamesRegex = new RegExp(
    Object.keys(cssFiles)
      .map(path => basename(path))
      .join('|'),
    'g',
  );

  for (const codeDict of [tsFiles, cssFiles, resources]) {
    for (const [filePath, content] of Object.entries(codeDict)) {
      const contentWithScssRefReplaced = content.replace(fileNamesRegex, fileName => {
        console.log('match fileName:', fileName);
        return cssToScss(fileName);
      });
      codeDict[filePath] = contentWithScssRefReplaced;
    }
  }
}
