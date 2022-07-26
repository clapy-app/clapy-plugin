import { exportTemplatesDir } from '../../../../root.js';
import { getComponentName } from '../../gen-node-utils/gen-unique-name-utils.js';
import type { FrameworkConnector } from '../framework-connectors.js';
import { patchSCSSInFileContents } from './scss.js';

const csbDir = `${exportTemplatesDir}/react-cra`;
const zipDir = `${exportTemplatesDir}/react-vite`;

export const reactConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.useZipProjectTemplate ? zipDir : csbDir),
  patchSCSSInFileContents,
  appCompDir: 'src',
  appCompName: 'App',
  // MyRectangle
  getBaseCompName: (projectContext, node) => getComponentName(projectContext, node),
  // MyRectangle
  getCompName: (projectContext, node, baseCompName) => baseCompName,
  // MyRectangle
  getCompDirName: (baseCompName: string) => baseCompName,
  // MyRectangle.tsx
  getCompFileName: compDir => `${compDir}.tsx`,
};
