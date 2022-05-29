import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { addFrontDefineVarToContext, BuildContext, pluginDir } from './src/scripts/esbuild/build-prepare';

const context: BuildContext = {};
addFrontDefineVarToContext(context);
export default defineConfig({
  root: `${pluginDir}/src`,
  plugins: [react()],
  define: context.defineEnvVar,
});
