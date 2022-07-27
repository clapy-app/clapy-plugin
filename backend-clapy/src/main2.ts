import { waitInfinite } from './common/general-utils.js';
import { perfReset, perfTotal } from './common/perf-utils.js';

// To work on features outside the webservice, and keep live reload.

async function main() {
  perfReset('Starting...');

  // Send to codesandbox
  // TODO restore. Find the syntax to instantiate the controller with the right dependencies
  // await new CodeController().exportCode(devFigmaConfig, false);

  // await insertTrackings();

  perfTotal();
}

main().catch(err => {
  console.error('Error caught in main2.ts, normally sent to the client.');
  console.error(err);
});

waitInfinite();
