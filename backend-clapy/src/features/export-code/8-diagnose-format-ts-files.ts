import prettierFormatPlugin from '@trivago/prettier-plugin-sort-imports';
import { readFile } from 'fs/promises';
// @ts-ignore
import parserHtml from 'prettier/parser-html.js';
// @ts-ignore
import parserCss from 'prettier/parser-postcss.js';
// @ts-ignore
import parserTypeScript from 'prettier/parser-typescript.js';
// @ts-ignore
import prettier from 'prettier/standalone.js';

import { flags } from '../../env-and-config/app-config.js';
import { backendDir } from '../../root.js';
import type { CodeDict } from './code.model.js';

let _prettierConfig: any;

export async function getPrettierConfig() {
  if (!_prettierConfig) {
    let conf = JSON.parse(await readFile(`${backendDir}/.prettierrc`, { encoding: 'utf8' }));
    // // Remove importOrderParserPlugins if any issue with below code.
    // // But it is required to format Angular code, which contains annotations.
    // // It should also be left in the original .prettierrc because our webservice uses it.
    // let importOrderParserPlugins: any;
    // ({ importOrderParserPlugins, ...conf } = conf);
    _prettierConfig = conf;
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
      if (content == null) {
        throw new Error(`Undefined content for file in tsFiles at path ${path}`);
      }
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
        content = prettier.format(content, {
          ...(await getPrettierConfig()),
          // pluginSearchDirs: [resolve(`${backendDir}/node_modules`)],
          // Beware: prettier plugins need to be declared here (couldn't make them work with auto-detection from node_modules), but svgo (used to generate SVG and format their code with Prettier) auto-loads Prettier plugins from node_modules. 2 different behaviors.
          plugins: [parserTypeScript, prettierFormatPlugin],
          filepath: path,
        });
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
      try {
        if (content == null) {
          throw new Error(`Undefined content for file in cssFiles at path ${path}`);
        }
        cssFiles[path] = await formatCssFile(path, content);
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  }
}

export async function formatCssFile(path: string, content: string) {
  if (!flags.formatCode) {
    return content;
  }
  // Prettier
  return prettier.format(content, {
    ...(await getPrettierConfig()),
    plugins: [parserCss],
    filepath: path,
  });
}

export async function prepareHtmlFiles(htmlFiles: CodeDict) {
  for (const [path, content] of Object.entries(htmlFiles)) {
    if (flags.formatCode && path.startsWith('src') && path.endsWith('.html')) {
      try {
        if (content == null) {
          throw new Error(`Undefined content for file in htmlFiles at path ${path}`);
        }
        htmlFiles[path] = await formatHtmlFile(path, content);
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  }
}

export async function formatHtmlFile(path: string, content: string) {
  if (!flags.formatCode) {
    return content;
  }
  // Prettier
  return prettier.format(content, {
    ...(await getPrettierConfig()),
    plugins: [parserHtml],
    filepath: path,
  });
}
