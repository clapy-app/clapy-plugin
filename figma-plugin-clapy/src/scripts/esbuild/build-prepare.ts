import * as dotenv from 'dotenv';
import { BuildOptions } from 'esbuild';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

import { Dict } from '../../common/sb-serialize.model';

export interface BuildContext {
  outDir?: string;
  outDirPath?: string;
  defineEnvVar?: Dict<string>;
}

// In case we have to switch to ESM. But it doesn't work well (importing other files, default extensions, default imports...)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

export const pluginDir = resolve(`${__dirname}/../../..`);
const rootDir = resolve(`${pluginDir}/..`);

export const indexHtmlPath = `${pluginDir}/src/index.html`;

let dotEnvLoaded = false;

function readEnv(context: BuildContext) {
  const previewEnv = (process.env.PREVIEW_ENV || undefined) as 'figma' | 'browser' | undefined;
  const mode = process.env.NODE_ENV || 'development';
  const appEnv = process.env.APP_ENV;
  const isProduction = mode === 'production';
  const isDevelopment = !isProduction;
  const isDevEnv = appEnv === 'dev' || appEnv === 'development';
  const isStagingEnv = appEnv === 'staging';
  const isProdEnv = appEnv === 'production' || appEnv === 'prod';
  const shouldUseSourceMap = true;
  // If not production and not browser, it's a normal dev env in Figma.

  context.outDir = isProduction ? 'build-prod' : 'build';
  context.outDirPath = `${pluginDir}/${context.outDir}`;

  if (!dotEnvLoaded) {
    dotEnvLoaded = true;
    dotenv.config({
      path: `${rootDir}/${isDevEnv ? '.env' : isStagingEnv ? '.env.staging' : '.env.production'}`,
    });
  }

  return { isProduction, appEnv, previewEnv };
}

export async function updateDistManifest(context: BuildContext) {
  const { isProduction } = readEnv(context);

  // Update manifest.json with the bundle folder name.
  const distFolder = 'build';
  if (isProduction) {
    await editJsonFile(`${pluginDir}/dist/manifest.json`, manifest => {
      const mainSplit = manifest.main.split('/');
      mainSplit[0] = distFolder;
      manifest.main = mainSplit.join('/');
      const uiSplit = manifest.ui.split('/');
      uiSplit[0] = distFolder;
      manifest.ui = uiSplit.join('/');

      manifest.name = 'Clapy beta';
      manifest.id = '1083031796594968801';
    });
  }
}

export function addFrontDefineVarToContext(context: BuildContext) {
  const frontVarToDefine = prepareFrontVarToDefine(context);
  const defineEnvVar: Dict<string> = {};
  for (const [key, val] of Object.entries(frontVarToDefine)) {
    defineEnvVar[`process.env.${key}`] = val;
  }
  context.defineEnvVar = defineEnvVar;
}

function prepareFrontVarToDefine(context: BuildContext) {
  const { appEnv, previewEnv } = readEnv(context);

  // Extract environment variables to send to the React app
  const frontVarToDefine: Dict<string> = {
    APP_ENV: JSON.stringify(appEnv),
    PREVIEW_ENV: JSON.stringify(previewEnv),
  };
  for (const [varName, value] of Object.entries(process.env)) {
    if (varName.startsWith('VITE_') || varName.startsWith('REACT_APP_')) {
      frontVarToDefine[varName] = JSON.stringify(value);
    }
  }

  return frontVarToDefine;
}

async function editJsonFile(filePath: string, editor: (modulePath: any) => void) {
  const file = JSON.parse(await readFile(filePath, { encoding: 'utf8' }));
  editor(file);
  await writeFile(filePath, JSON.stringify(file, null, 2));
}

export function createESBuildConfig<T extends BuildOptions>(config: T): T {
  return config;
}
