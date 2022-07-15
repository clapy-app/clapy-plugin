// import { readFile } from 'fs/promises';
// import {
//   CompilerOptions,
//   getCompilerOptionsFromTsConfig,
//   IndentationText,
//   InMemoryFileSystemHost,
//   NewLineKind,
//   Project,
//   QuoteKind,
// } from 'ts-morph';
// import { flags } from '../../../env-and-config/app-config.js';
// import { env } from '../../../env-and-config/env.js';
// import { exportTemplatesDir } from '../../../root.js';
// import { reactRootInMemory } from './load-file-utils-and-paths.js';

// const nodeModulesTemplatePath = `${exportTemplatesDir}/node_modules`;

// export const tsConfigFilePath = `${reactRootInMemory}/tsconfig.json`;

// const NO_INPUT_FILE_ERROR = 18003;

// // Unused for now, but it contains useful ts config and react typings addition in case we need to diagnose the TS project.
// export async function createProjectFromTsConfig(tsConfig: string) {
//   const fileSystem = new InMemoryFileSystemHost();
//   fileSystem.writeFileSync(tsConfigFilePath, tsConfig);
//   const { errors, options } = getCompilerOptionsFromTsConfig(tsConfigFilePath, { fileSystem });
//   const err = errors.filter(e => e.getCode() !== NO_INPUT_FILE_ERROR);
//   if (Array.isArray(err) && err.length) {
//     console.warn('Errors while reading tsconfig:', err);
//   }
//   const compilerOptions: CompilerOptions = {
//     ...options,
//     noEmit: true,
//     skipLibCheck: true,
//   };
//   const project = new Project({
//     compilerOptions,
//     fileSystem,
//     manipulationSettings: {
//       indentationText: IndentationText.TwoSpaces,
//       newLineKind: NewLineKind.LineFeed,
//       quoteKind: QuoteKind.Single,
//       usePrefixAndSuffixTextForRename: false,
//       useTrailingCommas: true,
//       insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
//     },
//   });
//   if (env.isDev && flags.loadLibsTypings) {
//     try {
//       for (const path of [
//         '@types/react/index.d.ts',
//         '@types/react/global.d.ts',
//         '@types/react/jsx-runtime.d.ts',
//         '@types/react-dom/index.d.ts',
//         'react-scripts/lib/react-app.d.ts',
//       ]) {
//         const fsPath = `${nodeModulesTemplatePath}/${path}`;
//         const inMemoryPath = `${reactRootInMemory}/node_modules/${path}`;
//         project.createSourceFile(inMemoryPath, await readFile(fsPath, { encoding: 'utf-8' }));
//       }
//     } catch (error: any) {
//       if (error.code !== 'ENOENT') {
//         throw error;
//       } else {
//         console.warn('node_modules do not exist in template project, types cannot be loaded for type checking.');
//       }
//     }
//   }
//   return project;
// }
