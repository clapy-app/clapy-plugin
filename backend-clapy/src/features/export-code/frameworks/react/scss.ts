import type { ExtraConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict } from '../../code.model.js';

export function patchSCSSInFileContents(filesCsb: CodeDict, extraConfig: ExtraConfig) {
  if (extraConfig.scss) {
    const indexTsxPath = extraConfig.useViteJS ? 'src/main.tsx' : 'src/index.tsx';
    if (!filesCsb[indexTsxPath]) {
      throw new Error(
        `index file not found while checking for SCSS replacement. indexTsxPath: ${indexTsxPath} - useViteJS: ${extraConfig.useViteJS}`,
      );
    }
    filesCsb[indexTsxPath] = filesCsb[indexTsxPath].replace('resets.css', 'resets.scss');
  }
}
