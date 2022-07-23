import { exportTemplatesDir } from '../../../../root.js';
import type { FrameworkConnector } from '../framework-connectors.js';
import { patchSCSSInFileContents } from './scss.js';

export const reactCRADir = `${exportTemplatesDir}/react-cra`;
export const reactViteDir = `${exportTemplatesDir}/react-vite`;

export const reactConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.useViteJS ? reactViteDir : reactCRADir),
  patchSCSSInFileContents,
};
