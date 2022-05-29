import { Dict } from '../../common/sb-serialize.model';
import { createESBuildConfig } from './build-prepare';

export async function getConfigBackend(defineEnvVar: Dict<string>) {
  return createESBuildConfig({
    entryPoints: ['src/backend/backend.ts'],
    bundle: true,
    outfile: 'build/backend.js',
    target: 'es2017',
    logLevel: 'info',
    define: defineEnvVar,
  });
}
