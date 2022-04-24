import { readFile } from 'fs/promises';
import prettierFormatPlugin from 'prettier-plugin-organize-imports';
import parserCss from 'prettier/parser-postcss';
import parserTypeScript from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';
import { flags } from '../../env-and-config/app-config';
import { backendDir } from '../../root';
import { CodeDict } from './code.model';

let _prettierConfig: any;

export async function getPrettierConfig() {
  if (!_prettierConfig) {
    _prettierConfig = JSON.parse(await readFile(`${backendDir}/.prettierrc`, { encoding: 'utf8' }));
  }
  return _prettierConfig;
}

const newlineAfterImportRegex = /(import [^\n]+)(\n+)(?!import)/;

export async function diagnoseFormatTsFiles(tsFiles: CodeDict) {
  // Global diagnostic
  // TODO to restore later
  // if (env.isDev && flags.runDiagnostics) {
  //   const globalDiag = project.getPreEmitDiagnostics();
  //   if (globalDiag.length) {
  //     console.log(project.formatDiagnosticsWithColorAndContext(globalDiag));
  //   }
  // }

  const tsFilesFormatted: CodeDict = {};
  for (let [path, content] of Object.entries(tsFiles)) {
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
    if (flags.formatCode && path.startsWith('src')) {
      // Native TS (ts-morph using ts methods internally)
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
      try {
        content = prettier
          .format(content, {
            ...(await getPrettierConfig()),
            // pluginSearchDirs: [resolve(`${backendDir}/node_modules`)],
            // Beware: prettier plugins need to be declared here (couldn't make them work with auto-detection from node_modules), but svgo (used to generate SVG and format their code with Prettier) auto-loads Prettier plugins from node_modules. 2 different behaviors.
            plugins: [parserTypeScript, prettierFormatPlugin],
            filepath: path,
          })
          // Patch because I haven't found obvious way with Prettier to insert a line break after the imports.
          // There is another plugin to format imports, but it's harder to make it work with both the generated code and this project (source) because of the parser required to work with annotations + the fact that it doesn't delete unused imports on its own. (but it's possible if we need to get back to it.)
          .replace(newlineAfterImportRegex, '$1\n\n');
      } catch (error) {
        console.warn(`Error while formatting with prettier the file ${path}. Formatting is skipped.`);
        console.warn(error);
      }
    }

    tsFilesFormatted[path] = content;
  }
  return tsFilesFormatted;
}

export async function prepareCssFiles(cssFiles: CodeDict) {
  for (const [path, content] of Object.entries(cssFiles)) {
    if (flags.formatCode && path.startsWith('src')) {
      cssFiles[path] = await formatCssFile(path, content);
    }
  }
}

export async function formatCssFile(path: string, content: string) {
  if (flags.formatCode) {
    // Prettier
    return prettier.format(content, {
      ...(await getPrettierConfig()),
      plugins: [parserCss],
      filepath: path,
    });
  } else {
    return content;
  }
}
