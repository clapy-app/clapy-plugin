import * as esbuild from 'esbuild';

import { addFrontDefineVarToContext, BuildContext } from './build-prepare';
import { getConfigBackend } from './config-backend';
import { getConfigFront } from './config-front';

runBuild().catch((e: any) => {
  const isBuildErrorLoggedByESBuild = !!(e.errors && e.warnings);
  if (!isBuildErrorLoggedByESBuild) {
    console.error(e);
    // Don't exit yet, so that we have time to read the error if using VSCode tasks.
    setTimeout(() => {}, 1000 * 60 * 60 * 24);
    // process.exit(1);
  }
});

async function runBuild() {
  const context: BuildContext = {};

  addFrontDefineVarToContext(context);

  await Promise.all([
    esbuild.build({
      ...(await getConfigFront(context)),
      // Add development config
      watch: true,
      sourcemap: 'inline',
    }),
    esbuild.build({
      ...(await getConfigBackend(context)),
      // Add development config
      watch: true,
      sourcemap: 'inline',
    }),
  ]);
}
