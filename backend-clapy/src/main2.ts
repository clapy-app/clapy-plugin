import { waitInfinite } from './common/general-utils.js';
import { perfReset, perfTotal } from './common/perf-utils.js';
import { fetchGHTest } from './features/github/github-auth.js';

async function main() {
  perfReset('Starting...');

  // To work on features outside the webservice, and keep live reload.

  // const document = parse('<!DOCTYPE html><html><head></head><body><div></div><p></p></body></html>');
  // console.log(serialize(document));
  // const tag = ((document.childNodes[1] as Element).childNodes[1] as Element).childNodes[1];
  // console.log(serializeHtml(tag));

  // console.log(serializeHtml(mkHtmlElement('div', mkHtmlAttribute('class', 'bar'))));
  await fetchGHTest();

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
