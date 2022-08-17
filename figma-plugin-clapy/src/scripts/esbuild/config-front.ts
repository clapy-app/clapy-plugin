import * as cssModulesPlugin from 'esbuild-css-modules-plugin';
import { readFile, writeFile } from 'fs/promises';

import type { BuildContext } from './build-prepare';
import { createESBuildConfig, indexHtmlPath, pluginDir } from './build-prepare';

export async function getConfigFront(context: BuildContext) {
  const defineEnvVar = context.defineEnvVar;
  return createESBuildConfig({
    entryPoints: ['src/index.tsx'],

    bundle: true,
    outfile: `${context.outDir}/index.js`,
    target: 'es2017',
    logLevel: 'info',

    define: defineEnvVar,
    inject: ['src/scripts/esbuild/react-shim.js'],
    format: 'esm',
    loader: {
      '.jpg': 'dataurl',
      '.jpeg': 'dataurl',
      '.png': 'dataurl',
      '.gif': 'dataurl',
      '.svg': 'dataurl',
      '.ico': 'dataurl',
      '.webp': 'dataurl',
      '.avif': 'dataurl',
    },
    plugins: [
      cssModulesPlugin({
        inject: true,
        localsConvention: 'camelCase',
      }),
      {
        name: 'example',
        setup(build) {
          build.onEnd(async result => {
            const indexJsPath = `${pluginDir}/${build.initialOptions.outfile}`;
            const indexCssPath = `${pluginDir}/${build.initialOptions.outfile?.replace('.js', '.css')}`;
            let [indexHtml, indexJs, indexCss] = await Promise.all([
              await readFile(indexHtmlPath, { encoding: 'utf-8' }),
              await readFile(indexJsPath, { encoding: 'utf-8' }),
              await readFile(indexCssPath, { encoding: 'utf-8' }),
            ]);

            // Remove the ViteJS-specific script referencing the main
            indexHtml = indexHtml.replace('<script type="module" src="[^"]+"></script>', '');

            indexHtml = insertAtSubStrIndex(indexHtml, '</head>', `<style>\n${indexCss}</style>\n`);
            indexHtml = insertAtSubStrIndex(
              indexHtml,
              '</body>',
              `<script type="module">\n${indexJs}</script>\n</body>`,
            );
            await writeFile(`${context.outDirPath}/index.html`, indexHtml);
            console.log(`build ended with ${result.errors.length} errors`);
          });
        },
      },
    ],
  });
}

function insertAtSubStrIndex(str: string, subStrForIndex: string, toInsert: string) {
  const i = str.indexOf(subStrForIndex);
  if (i === -1) throw new Error('Cannot replace, substring not found');
  'abcdef'.substring(0, 2);
  return `${str.substring(0, i)}${toInsert}${str.substring(i)}`;
}
