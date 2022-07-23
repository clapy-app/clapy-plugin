import { exportTemplatesDir } from '../../../../root.js';
import type { FrameworkConnector } from '../framework-connectors.js';
import { patchSCSSInFileContents } from './scss.js';

export const csbDir = `${exportTemplatesDir}/angular-csb`;
export const zipDir = `${exportTemplatesDir}/angular-zip`;

export const angularConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.output === 'csb' ? csbDir : zipDir),
  patchSCSSInFileContents,
};
