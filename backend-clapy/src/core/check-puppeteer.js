// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteer = require('puppeteer');

async function main() {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: [
        '--window-size=500,500',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // '--disable-dev-shm-usage', // If insufficient memory for Chrome, see https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#tips
      ],
      dumpio: true, // Show browser logs in node app logs.
      defaultViewport: null, // The viewport will take the window size (to mimic real browsers' behavior) instead of having its own sizing.
      // defaultViewport: {
      //   width: 500,
      //   height: 500
      // },
      //   // executablePath: '/usr/bin/chromium-browser',
      //   executablePath: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
      //   userDataDir: '/mnt/c/Users/Antoine/AppData/Local/Temp/puppeteer_user_data',///
      //   args: [
      //     // '--no-sandbox', '--disable-setuid-sandbox',
      //     '--disable-gpu',
      //     '--disable-dev-shm-usage',
      //     '--disable-setuid-sandbox',
      //     '--no-first-run',
      //     '--no-sandbox',
      //     '--no-zygote',
      //     '--single-process',
      //   ],
    });
    console.log(await browser.version());

    const sbUrl = 'https://style.monday.com';
    const storybookId = 'buttons-button--overview';
    //
    // const sbUrl = 'https://reactstrap.github.io';
    // const storybookId = 'components-button--button';

    const url = `${sbUrl}/iframe.html?id=${storybookId}&viewMode=story`;
    const page = await browser.newPage();
    await page.goto(url);
    const dimensions = await page.evaluate(() => {
      // const btn = document.querySelector('.btn-primary');
      return {
        // Get the button width
        // buttonWidth: btn?.clientWidth,
        // Get the "viewport" of the page, as reported by the page.
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        deviceScaleFactor: window.devicePixelRatio,
      };
    });
    console.log('Dimensions:', dimensions);
    //
    // await page.screenshot({ path: 'components-button--button.png' });
  } catch (err) {
    console.error('###### puppeteer');
    console.error(err);
  } finally {
    await browser?.close();
  }
}
main();
