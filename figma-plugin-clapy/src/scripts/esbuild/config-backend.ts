import type { BuildContext } from './build-prepare';
import { createESBuildConfig } from './build-prepare';

export async function getConfigBackend(context: BuildContext) {
  const defineEnvVar = context.defineEnvVar;
  return createESBuildConfig({
    entryPoints: ['src/backend/backend.ts'],
    bundle: true,
    outfile: `${context.outDir}/backend.js`,
    target: 'es2017',
    logLevel: 'info',
    define: defineEnvVar,
  });
}
