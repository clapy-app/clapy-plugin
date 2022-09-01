import { exportTemplatesDir } from '../../../root.js';
import { srcCompPrefix } from '../9-upload-to-csb.js';
import type { ProjectContext } from '../code.model.js';
import { getCSSExtension } from '../tech-integration/scss/scss-utils.js';

const resetsModuleBase = '_resets.module';
const resetsCssModulePath = `${srcCompPrefix}${resetsModuleBase}`;
export const resetsCssModuleSrcPath = `${exportTemplatesDir}/${resetsModuleBase}`;

export function getResetsModuleBase(projectContext: ProjectContext) {
  return `${resetsModuleBase}.${getCSSExtension(projectContext)}`;
}

export function getResetsCssModulePath(projectContext: ProjectContext) {
  return `${resetsCssModulePath}.${getCSSExtension(projectContext)}`;
}

export function getResetsCssModuleSrcPath(projectContext: ProjectContext) {
  return `${resetsCssModuleSrcPath}.${getCSSExtension(projectContext)}`;
}

export function getCssResetsPath(projectContext: ProjectContext) {
  return `src/resets.${getCSSExtension(projectContext)}`;
}
