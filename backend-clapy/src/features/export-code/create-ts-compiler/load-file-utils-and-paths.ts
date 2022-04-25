import { exportTemplatesDir } from '../../../root';
import { CodeDict } from '../code.model';

export const reactTemplateDir = `${exportTemplatesDir}/react-project`;
export const frameworksTemplateDir = `${exportTemplatesDir}/frameworks`;

export const indexHtmlPath = 'public/index.html';

// Both variables must be consistent.
export const assetsResourceDir = `public/assets/`;
// Here, '', '/' or '.' points to the public directory.
export const assetsCssBaseUrl = 'assets/';

export const reactRootInMemory = '';

export function separateTsAndResources(files: CodeDict) {
  const tsFiles: CodeDict = {};
  const resources: CodeDict = {};
  for (const [path, content] of Object.entries(files)) {
    // All supported extensions:
    // '.ts', '.tsx', '.d.ts', '.js', '.jsx', '.cts', '.d.cts', '.cjs', '.mts', '.d.mts', '.mjs'
    if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
      tsFiles[path] = content;
    } else {
      resources[path] = content;
    }
  }
  return [tsFiles, resources];
}
