import { renameField } from '../../../../common/general-utils.js';
import type { ExtraConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict } from '../../code.model.js';
import { getCSSExtension } from '../../tech-integration/scss/scss-utils.js';
import { reactAppCompDir, reactAppCompName } from './constants.js';

export function renameTemplateCSSFiles(filesCsb: CodeDict, extraConfig: ExtraConfig) {
  if (extraConfig.scss) {
    const cssExt = getCSSExtension(extraConfig);
    const appCssTemplateFileName = `${reactAppCompName}.module.css`;
    const appCssFileName = `${reactAppCompName}.module.${cssExt}`;
    const appCssPathTemplate = `${reactAppCompDir}/${appCssTemplateFileName}`;
    const appCssPath = `${reactAppCompDir}/${appCssFileName}`;
    renameField(filesCsb, appCssPathTemplate, appCssPath);
    renameField(filesCsb, 'src/resets.css', 'src/resets.scss');
    const indexTsxPath = extraConfig.useViteJS ? 'src/main.tsx' : 'src/index.tsx';
    filesCsb[indexTsxPath] = filesCsb[indexTsxPath].replace('resets.css', 'resets.scss');
  }
}
