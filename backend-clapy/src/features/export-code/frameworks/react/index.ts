import { exportTemplatesDir } from '../../../../root.js';
import type { FrameworkConnector } from '../framework-connectors.js';
import { patchSCSSInFileContents } from './scss.js';

const csbDir = `${exportTemplatesDir}/react-cra`;
const zipDir = `${exportTemplatesDir}/react-vite`;

export const reactConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.useZipProjectTemplate ? zipDir : csbDir),
  patchSCSSInFileContents,
};
