import { readFile } from 'fs/promises';
import {
  CompilerOptions,
  getCompilerOptionsFromTsConfig,
  IndentationText,
  InMemoryFileSystemHost,
  NewLineKind,
  Project,
  QuoteKind,
} from 'ts-morph';

import { flags } from '../../../env-and-config/app-config';
import { env } from '../../../env-and-config/env';
import { exportTemplatesDir } from '../../../root';
import { CodeDict } from '../code.model';
import { reactRootInMemory } from './load-file.utils';

const nodeModulesTemplatePath = `${exportTemplatesDir}/node_modules`;

export const tsConfigFilePath = `${reactRootInMemory}/tsconfig.json`;

const NO_INPUT_FILE_ERROR = 18003;

export async function createProjectFromTsConfig(tsConfig: string) {
  const fileSystem = new InMemoryFileSystemHost();
  fileSystem.writeFileSync(tsConfigFilePath, tsConfig);
  const { errors, options } = getCompilerOptionsFromTsConfig(tsConfigFilePath, { fileSystem });
  const err = errors.filter(e => e.getCode() !== NO_INPUT_FILE_ERROR);
  if (Array.isArray(err) && err.length) {
    console.warn('Errors while reading tsconfig:', err);
  }
  const compilerOptions: CompilerOptions = {
    ...options,
    noEmit: true,
    skipLibCheck: true,
  };
  const project = new Project({
    compilerOptions,
    fileSystem,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      newLineKind: NewLineKind.LineFeed,
      quoteKind: QuoteKind.Single,
      usePrefixAndSuffixTextForRename: false,
      useTrailingCommas: true,
      insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
    },
  });
  if (env.isDev && flags.loadLibsTypings) {
    try {
      for (const path of [
        '@types/react/index.d.ts',
        '@types/react/global.d.ts',
        '@types/react/jsx-runtime.d.ts',
        '@types/react-dom/index.d.ts',
        'react-scripts/lib/react-app.d.ts',
      ]) {
        const fsPath = `${nodeModulesTemplatePath}/${path}`;
        const inMemoryPath = `${reactRootInMemory}/node_modules/${path}`;
        project.createSourceFile(inMemoryPath, await readFile(fsPath, { encoding: 'utf-8' }));
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      } else {
        console.warn('node_modules do not exist in template project, types cannot be loaded for type checking.');
      }
    }
  }
  return project;
}

export function separateTsAndResources(files: CodeDict) {
  const filesForCompiler: CodeDict = {};
  const resources: CodeDict = {};
  for (const [path, content] of Object.entries(files)) {
    // All supported extensions:
    // '.ts', '.tsx', '.d.ts', '.js', '.jsx', '.cts', '.d.cts', '.cjs', '.mts', '.d.mts', '.mjs'
    if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
      filesForCompiler[path] = content;
    } else {
      resources[path] = content;
    }
  }
  return [filesForCompiler, resources];
}
