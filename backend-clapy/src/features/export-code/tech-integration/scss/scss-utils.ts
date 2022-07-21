import { renameField } from '../../../../common/general-utils.js';
import type { ExtraConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict, ProjectContext } from '../../code.model.js';

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

export function getAppCssPathAndRenameSCSS(
  filesCsb: CodeDict,
  extraConfig: ExtraConfig,
  appCompDir: string,
  appCompName: string,
) {
  const cssExt = getCSSExtension(extraConfig);
  const appCssTemplateFileName = `${appCompName}.module.css`;
  const appCssFileName = `${appCompName}.module.${cssExt}`;
  const appCssPathTemplate = `${appCompDir}/${appCssTemplateFileName}`;
  const appCssPath = `${appCompDir}/${appCssFileName}`;
  if (extraConfig.scss) {
    renameField(filesCsb, appCssPathTemplate, appCssPath);
    renameField(filesCsb, 'src/resets.css', 'src/resets.scss');
    const indexTsxPath = extraConfig.useViteJS ? 'src/main.tsx' : 'src/index.tsx';
    filesCsb[indexTsxPath] = filesCsb[indexTsxPath].replace('resets.css', 'resets.scss');
  }
  return appCssPath;
}
