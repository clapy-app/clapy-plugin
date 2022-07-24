import { exportTemplatesDir } from '../../../../root.js';
import type { FrameworkConnector } from '../framework-connectors.js';
import { patchSCSSInFileContents } from './scss.js';

const csbDir = `${exportTemplatesDir}/angular-csb`;
const zipDir = `${exportTemplatesDir}/angular-zip`;

export const angularConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.useZipProjectTemplate ? zipDir : csbDir),
  patchSCSSInFileContents,
};
