import * as esbuild from 'esbuild';

import { addFrontDefineVarToContext, BuildContext, updateDistManifest } from './build-prepare';
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

  // Update the manifest to use the release plugin name and ID
  await updateDistManifest(context);

  addFrontDefineVarToContext(context);

  const [resFront, resBack] = await Promise.all([
    esbuild.build({
      ...(await getConfigFront(context)),
      // Add production config
      watch: false,
      sourcemap: false,
      minify: true,
      legalComments: 'none',
      treeShaking: true,
      // metafile: true,
    }),
    esbuild.build({
      ...(await getConfigBackend(context)),
      // Add production config
      watch: false,
      sourcemap: false,
      minify: true,
      legalComments: 'none',
      treeShaking: true,
      // metafile: true,
    }),
  ]);

  // Requires metafile: true in configs above.
  // Analyze the json with https://www.bundle-buddy.com/esbuild
  // await writeFile(resolve(pluginDir, 'build', 'meta.json'), JSON.stringify(resFront.metafile, null, 2));
  // await writeFile(resolve(pluginDir, 'build', 'meta.txt'), await esbuild.analyzeMetafile(resFront.metafile, { color: true, verbose: true }));
}
