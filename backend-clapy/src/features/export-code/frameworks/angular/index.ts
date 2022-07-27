import { exportTemplatesDir } from '../../../../root.js';
import { getComponentName, TextCase } from '../../gen-node-utils/gen-unique-name-utils.js';
import type { FrameworkConnector } from '../framework-connectors.js';
import { patchSCSSInFileContents } from './scss.js';

const csbDir = `${exportTemplatesDir}/angular-csb`;
const zipDir = `${exportTemplatesDir}/angular-zip`;

export const angularConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.useZipProjectTemplate ? zipDir : csbDir),
  patchSCSSInFileContents,
  appCompDir: 'src/app',
  appCompName: 'app',
  // my-rectangle
  getBaseCompName: (projectContext, node) => getComponentName(projectContext, node, TextCase.Dash),
  // MyRectangleComponent
  getCompName: (projectContext, node, baseCompName) => `${getComponentName(projectContext, node)}Component`,
  // my-rectangle
  getCompDirName: (baseCompName: string) => baseCompName,
  // my-rectangle.component.ts
  getCompFileName: compDir => `${compDir}.component.ts`,
};
