import puppeteer, {
  Browser,
  EvaluateFn,
  EvaluateFnReturnType,
  SerializableOrJSHandle,
  UnwrapPromiseLike,
} from 'puppeteer';

import { env } from '../../environment/env';

// Could improve typing of ...args to match the real arguments of inBrowserFunction.
// We can get inspiration from the fetchPlugin function in the plugin project (client).
export async function runInPuppeteerBrowser<T extends EvaluateFn>(
  url: string,
  inBrowserFunction: T,
  ...args: SerializableOrJSHandle[]
): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>> {
  let browser: Browser | undefined = undefined;
  try {
    browser = await puppeteer.launch({
      // // Show browser logs in node app logs.
      // dumpio: true,

      // Show the browser (no headless) and open the devtools immediately (doesn't work in WSL2, x-server is missing).
      // devtools: true,

      args: [
        '--window-size=500,500',
        '--no-sandbox',
        '--disable-setuid-sandbox',

        // To allow reading styles from other domains
        // https://stackoverflow.com/a/52131823/4053349
        '--disable-web-security',
        // '--disable-features=IsolateOrigins',
        // '--disable-site-isolation-trials'

        // '--disable-dev-shm-usage', // If insufficient memory for Chrome, see https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#tips
      ],
      // Set to null to match the window size defined above (same behavior as real browsers)
      defaultViewport: null,
    });
    const page = await browser.newPage();
    // page.setDefaultTimeout(10000);

    // Check the page dimensions
    // console.log('Dimensions:', await page.evaluate(() => ({
    //   width: document.documentElement.clientWidth,
    //   height: document.documentElement.clientHeight,
    //   deviceScaleFactor: window.devicePixelRatio,
    // })));

    await page.goto(url);

    // Wait 0.5 second to load and run animations like fading
    // (e.g. Reactstrap Alert which opacity fades from 0 to 1, impacting getComputedStyles).
    await page.waitForTimeout(500);

    // await page.screenshot({ path: 'buttons-button--overview.png' });

    const result = await page.evaluate(inBrowserFunction, ...args);

    if (result === undefined) {
      throw new Error(`puppeteer returned undefined. Something in the returned content could not be serialized.`);
    }

    return result;
  } finally {
    await browser?.close();
  }
}

export function replaceLocalhostWithDockerHost(url: string) {
  return env.isDocker ? url.replace('localhost:9009', 'host.docker.internal:9009') : url;
}
