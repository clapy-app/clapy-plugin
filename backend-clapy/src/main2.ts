import { waitInfinite } from './common/general-utils';
import { perfReset, perfTotal } from './common/perf-utils';
import { CodeController } from './features/export-code/1-code-controller';
import { devFigmaConfig } from './features/export-code/dev-figma-config';

// To work on features outside the webservice, and keep live reload.

async function main() {
  perfReset('Starting...');

  // Send to codesandbox
  await new CodeController().exportCode(devFigmaConfig, true);

  // await insertTrackings();

  perfTotal();
}

main().catch();

waitInfinite();
