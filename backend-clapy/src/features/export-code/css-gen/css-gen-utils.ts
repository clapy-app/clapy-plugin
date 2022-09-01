import { exportTemplatesDir } from '../../../root.js';
import type { ProjectContext } from '../code.model.js';
import { getComponentsDirPath } from '../gen-node-utils/3-gen-comp-utils.js';
import { getCSSExtension } from '../tech-integration/scss/scss-utils.js';

const resetsModuleBase = '_resets.module';
export const resetsCssModuleSrcPath = `${exportTemplatesDir}/${resetsModuleBase}`;

export function getResetsModuleBase(projectContext: ProjectContext) {
  return `${resetsModuleBase}.${getCSSExtension(projectContext)}`;
}

export function getResetsCssModulePath(projectContext: ProjectContext) {
  const compDirPath = getComponentsDirPath(projectContext);
  return `${compDirPath}${resetsModuleBase}.${getCSSExtension(projectContext)}`;
}

export function getResetsCssModuleSrcPath(projectContext: ProjectContext) {
  return `${resetsCssModuleSrcPath}.${getCSSExtension(projectContext)}`;
}

export function getCssResetsPath(projectContext: ProjectContext) {
  return `src/resets.${getCSSExtension(projectContext)}`;
}
