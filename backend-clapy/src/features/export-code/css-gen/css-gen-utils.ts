import type { CodeDict, ProjectContext } from '../code.model.js';
import { resetsCssModulePath } from '../create-ts-compiler/load-file-utils-and-paths.js';
import { getCssResetsPath } from '../tech-integration/scss/scss-utils.js';

export function readResetRules(cssFiles: CodeDict) {
  const resets = cssFiles[resetsCssModulePath];
  const match = resets.match(/.*?\.clapyResets.*?\{\s*([^}]*?)\s*\}/);
  if (!match) throw new Error(`BUG should always match clapy resets in template file.`);
  return match[1];
}

export function patchCssResetsShared(projectContext: ProjectContext) {
  const { cssResetRules, extraConfig, cssFiles, fwConnector } = projectContext;
  const resetsCssPath = getCssResetsPath(extraConfig, false);
  if (extraConfig.globalResets) {
    cssFiles[resetsCssPath] = cssFiles[resetsCssPath].replace(
      /^(.+?\{\s*)\/\*\s*\$RESETS\s*\*\/(\s*\})/m,
      `$1${cssResetRules}$2`,
    );
  } else {
    // comments regex from https://stackoverflow.com/a/36328890/4053349
    // The second part matches the resets, selector + rules
    cssFiles[resetsCssPath] = cssFiles[resetsCssPath].replace(
      /(\s*\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/)?\s*.+?\{\s*\/\*\s*\$RESETS\s*\*\/\s*\}/,
      '',
    );
  }

  fwConnector.patchCssResets(projectContext);
}