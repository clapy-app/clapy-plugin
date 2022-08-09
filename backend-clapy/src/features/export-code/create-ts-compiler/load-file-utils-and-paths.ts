import { exportTemplatesDir } from '../../../root.js';
import type { ExtraConfig } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict } from '../code.model.js';

export const resetsCssModulePath = 'src/resets.module.css';
export const resetsCssModuleSrcPath = `${exportTemplatesDir}/resets.module.css`;

export function separateTsCssAndResources(files: CodeDict, extraConfig: ExtraConfig) {
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
