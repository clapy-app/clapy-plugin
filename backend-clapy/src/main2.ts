import { waitInfinite } from './common/general-utils';
import { perfReset, perfTotal } from './common/perf-utils';
import { exportCode } from './features/export-code/2-create-ts-compiler';
import { devFigmaConfig } from './features/export-code/dev-figma-config';

// To work on features outside the webservice, and keep live reload.

async function main() {
  console.log('Starting...');
  perfReset();

  // Send to codesandbox
  // await new CodeController().exportCode(null as any);
  await exportCode(devFigmaConfig);
  // await tryIt2_createTsProjectCompiler(devFigmaConfig);

  perfTotal();
}

main().catch();

waitInfinite();
