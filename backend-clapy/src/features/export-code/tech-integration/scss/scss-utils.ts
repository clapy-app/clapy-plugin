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

export function renameTemplateSCSSFiles(fwConnector: FrameworkConnector, filesCsb: CodeDict, extraConfig: ExtraConfig) {
  if (extraConfig.scss) {
    const filesCsb2: CodeDict = {};
    for (const [fileName, content] of Object.entries(filesCsb)) {
      if (fileName.endsWith('.css')) {
        filesCsb2[`${fileName.slice(0, -3)}scss`] = content;
      } else {
        filesCsb2[fileName] = content;
      }
    }
    fwConnector.patchSCSSInFileContents(filesCsb2, extraConfig);
    return filesCsb2;
  } else {
    return filesCsb;
  }
}
