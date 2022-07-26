import type { Dict3, ExtraConfig, SceneNode2, UserSettings } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict, ProjectContext } from '../code.model.js';
import { angularConnector } from './angular/index.js';
import { reactConnector } from './react/index.js';

export interface FrameworkConnector {
  templateBaseDirectory: (extraConfig: ExtraConfig) => string;
  patchSCSSInFileContents: (resources: CodeDict, extraConfig: ExtraConfig) => void;
  appCompDir: string;
  appCompName: string;
  getBaseCompName: (projectContext: ProjectContext, node: SceneNode2) => string;
  getCompName: (projectContext: ProjectContext, node: SceneNode2, baseCompName: string) => string;
  getCompDirName: (baseCompName: string) => string;
  getCompFileName: (compDir: string) => string;
}

export const frameworkConnectors = makeConnectors({
  react: reactConnector,
  angular: angularConnector,
});

// Wrapper to improve typing: the argument gets constrainted, and the output type is what is written as input (instead of the constraint itself).
// I.e. the output type will be { react: ..., angular: ... } instead of Dict3<..., ...>.
function makeConnectors<T extends Dict3<NonNullable<UserSettings['framework']>, FrameworkConnector>>(connectors: T) {
  return connectors;
}
