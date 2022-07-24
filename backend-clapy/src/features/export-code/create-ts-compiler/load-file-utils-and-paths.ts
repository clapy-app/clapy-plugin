import { exportTemplatesDir } from '../../../root.js';
import type { ExtraConfig } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict, ProjectContext } from '../code.model.js';
import { getCSSExtension } from '../tech-integration/scss/scss-utils.js';

export const frameworksTemplateDir = `${exportTemplatesDir}/frameworks`;

export function getIndexHtmlPath({ extraConfig: { useViteJS } }: ProjectContext) {
  return useViteJS ? 'index.html' : 'public/index.html';
}

// Both variables must be consistent.
export const assetsResourceDir = `public/assets/`;
// Here, '', '/' or '.' points to the public directory.
export const assetsCssBaseUrl = 'assets/';

export const reactRootInMemory = '';

export function separateTsCssAndResources(files: CodeDict, extraConfig: ExtraConfig) {
  const tsFiles: CodeDict = {};
  const cssFiles: CodeDict = {};
  const resources: CodeDict = {};
  const cssExt = getCSSExtension(extraConfig);
  for (const [path, content] of Object.entries(files)) {
    // All supported extensions:
    // '.ts', '.tsx', '.d.ts', '.js', '.jsx', '.cts', '.d.cts', '.cjs', '.mts', '.d.mts', '.mjs'
    if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
      tsFiles[path] = content;
    } else if (path.endsWith(`.css`)) {
      cssFiles[path] = content;
    } else {
      resources[path] = content;
    }
  }
  return [tsFiles, cssFiles, resources];
}
