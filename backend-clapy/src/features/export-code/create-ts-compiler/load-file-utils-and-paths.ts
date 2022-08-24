import type { CodeDict } from '../code.model.js';

export function separateTsCssAndResources(files: CodeDict) {
  const tsFiles: CodeDict = {};
  const cssFiles: CodeDict = {};
  const resources: CodeDict = {};
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
