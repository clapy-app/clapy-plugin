import { basename } from 'path';

import type { ExtraConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict, ProjectContext } from '../../code.model.js';

export const scssDevDependencies = {
  sass: '^1.53.0',
};

export function addScssPackage(projectContext: ProjectContext) {
  const { extraConfig, newDevDependencies, fwConnector } = projectContext;
  if (extraConfig.scss) {
    fwConnector.addScssPackages(newDevDependencies);
  }
}

export function getCSSExtension(extraConfig: ExtraConfig) {
  return extraConfig.scss ? 'scss' : 'css';
}

export function updateFilesAndContentForScss(extraConfig: ExtraConfig, projectContext: ProjectContext) {
  const { tsFiles, cssFiles, resources, fwConnector } = projectContext;
  if (extraConfig.scss) {
    replaceScssReferences(tsFiles, cssFiles, resources);
    renameTemplateSCSSFiles(cssFiles);
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
      if (content) {
        const contentWithScssRefReplaced = content.replace(fileNamesRegex, fileName => {
          return cssToScss(fileName);
        });
        codeDict[filePath] = contentWithScssRefReplaced;
      }
    }
  }
}
