import {
  getCompilerOptionsFromTsConfig,
  IndentationText,
  InMemoryFileSystemHost,
  NewLineKind,
  Project,
  QuoteKind,
} from 'ts-morph';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
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
  const compilerOptions = {
    ...options,
    noEmit: false,
  };
  return new Project({
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
}

export function mapCsbFilesToCompilerFormat(files: CodeDict) {
  const filesForCompiler: Dict<string> = {};
  for (const [path, content] of Object.entries(files)) {
    filesForCompiler[path] = content;
  }
  return filesForCompiler;
}
