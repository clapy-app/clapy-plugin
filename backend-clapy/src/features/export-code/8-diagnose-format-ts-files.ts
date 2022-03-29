import { readFile } from 'fs/promises';
import parserCss from 'prettier/parser-postcss';
import parserTypeScript from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';
import { Project } from 'ts-morph';

import { flags } from '../../env-and-config/app-config';
import { env } from '../../env-and-config/env';
import { backendDir } from '../../root';
import { CodeDict } from './code.model';

let _prettierConfig: any;

async function getPrettierConfig() {
  if (!_prettierConfig) {
    _prettierConfig = JSON.parse(await readFile(`${backendDir}/.prettierrc`, { encoding: 'utf8' }));
  }
  return _prettierConfig;
}

export async function diagnoseFormatTsFiles(project: Project) {
  // Global diagnostic
  if (env.isDev && flags.runDiagnostics) {
    const globalDiag = project.getPreEmitDiagnostics();
    if (globalDiag.length) {
      console.log(project.formatDiagnosticsWithColorAndContext(globalDiag));
    }
  }

  const tsFiles: CodeDict = {};
  for (const file of project.getSourceFiles()) {
    let path = file.getFilePath() as string;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    // File diagnostic - useful?
    // if (env.isDev && flags.runDiagnostics) {
    //   const diagnostics = project.getLanguageService().getSuggestionDiagnostics(file);
    //   if (diagnostics.length) {
    //     console.log(project.formatDiagnosticsWithColorAndContext(diagnostics));
    //   }
    // }

    // Formatting
    let content = file.getFullText();
    if (flags.formatCode && path.startsWith('src')) {
      // Native TS
      // file.formatText(tsFormatCodeSettings);
      //
      // ESLint - Couldn't make it work
      // const eslint = new ESLint({ fix: true /* , baseConfig */ });
      // const formatter = await eslint.loadFormatter('stylish');
      // const results = await eslint.lintText(content, { filePath: path });
      // await ESLint.outputFixes(results);
      // content = formatter.format(results);
      //
      // Prettier
      content = prettier.format(content, {
        ...(await getPrettierConfig()),
        plugins: [parserTypeScript],
        filepath: path,
      });
    }

    tsFiles[path] = content;
  }
  return tsFiles;
}

export async function prepareCssFiles(cssFiles: CodeDict) {
  for (const [path, content] of Object.entries(cssFiles)) {
    if (flags.formatCode && path.startsWith('src')) {
      // Prettier
      cssFiles[path] = prettier.format(content, {
        ...(await getPrettierConfig()),
        plugins: [parserCss],
        filepath: path,
      });
    }
  }
}
