import { performance } from 'perf_hooks';

import { waitInfinite } from './common/general-utils';
import { tryIt_createTsProjectCompiler } from './features/export-code/3-create-ts-compiler';
import { devFigmaConfig } from './features/export-code/dev-figma-config';

async function main() {
  console.log('Starting...');
  const start = performance.now();

  // Send to codesandbox
  // await new CodeController().exportCode(null as any);
  await tryIt_createTsProjectCompiler(devFigmaConfig);
  // await tryIt2_createTsProjectCompiler(devFigmaConfig);

  console.log('Done in', Math.round(performance.now() - start) / 1000, 's');
}

main().catch();

waitInfinite();
