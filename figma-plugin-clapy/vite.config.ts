import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { prepareFrontDefineVar } from './src/scripts/esbuild/build-prepare';

const frontDefineVar = prepareFrontDefineVar();
export default defineConfig({
  root: 'src',
  plugins: [react()],
  define: frontDefineVar,
});
