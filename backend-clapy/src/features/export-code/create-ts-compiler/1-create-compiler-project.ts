import {
  CompilerOptions,
  getCompilerOptionsFromTsConfig,
  IndentationText,
  InMemoryFileSystemHost,
  NewLineKind,
  Project,
  QuoteKind,
} from 'ts-morph';

import { CodeDict } from '../code.model';
import { reactRoot } from './load-file.utils';

export const tsConfigFilePath = `${reactRoot}/tsconfig.json`;

const NO_INPUT_FILE_ERROR = 18003;

export function createProjectFromTsConfig(tsConfig: string) {
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
  // project.addSourceFileAtPath(tsConfigFilePath);
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
