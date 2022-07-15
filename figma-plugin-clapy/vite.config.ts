import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// @ts-ignore
import type { BuildContext } from './src/scripts/esbuild/build-prepare';
import { addFrontDefineVarToContext, pluginDir } from './src/scripts/esbuild/build-prepare';

const context: BuildContext = {};
addFrontDefineVarToContext(context);
export default defineConfig({
  root: `${pluginDir}/src`,
  // import checker from 'vite-plugin-checker';
  // https://github.com/fi3ework/vite-plugin-checker
  // Checker can be useful, but let's try with the IDE problems only.
  // vite-plugin-checker to reinstall if we want to retry.
  plugins: [react() /* , checker({ typescript: true }) */],
  define: context.defineEnvVar,
});
