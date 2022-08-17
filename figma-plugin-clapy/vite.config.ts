// import react from '@vitejs/plugin-react';
import preact from '@preact/preset-vite';
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
  plugins: [preact() /* react() */ /* , checker({ typescript: true }) */],
  define: context.defineEnvVar,
  // resolve: {
  //   alias: {
  //     // react: 'preact/compat',
  //     // 'react-dom': 'preact/compat',
  //     react: 'preact/compat',
  //     'react-dom': 'preact/compat',
  //     'react/jsx-runtime': 'preact/jsx-runtime',
  //   },
  // },
});
