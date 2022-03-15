// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteer = require('puppeteer');

async function main() {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--window-size=500,500', '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null,
      // dumpio: true,
    });

    const sbUrl = 'https://style.monday.com';
    // const sbUrl = 'https://reactstrap.github.io';

    const url = sbUrl;
    const page = await browser.newPage();
    await page.goto(url);
    const storiesWrapper = await page.evaluate(async () => {
      try {
        // return Object.keys(window.__STORYBOOK_ADDONS.channel.data.setStories[0]);
        const { v, stories: storiesRaw } = window.__STORYBOOK_ADDONS.channel.data.setStories[0];
        const stories = {};
        for (const {
          // argTypes,
          // args,
          // componentId,
          id,
          kind,
          name,
          parameters: {
            // docs,
            // docsOnly,
            // fileName,
            // framework,
            // options,
            // themes,
            // viewMode,
            // __id,
            __isArgsStory,
          },
          story,
          title,
        } of Object.values(storiesRaw)) {
          // const {
          //   iframeHeight,
          //   inlineStories
          // } = docs || {};
          stories[id] = {
            // argTypes,
            // args: JSON.parse(JSON.stringify(args)), // may contain functions, e.g. onClick handler.
            // componentId,
            // id,
            kind,
            name,
            parameters: {
              // ...(!!docs && {
              //   docs: {
              //     iframeHeight,
              //     inlineStories
              //   }
              // }),
              // docsOnly,
              // fileName,
              // framework,
              // options,
              // themes,
              // viewMode,
              // __id,
              __isArgsStory,
            },
            story,
            title,
          };
        }
        return { v, stories };
      } catch (error) {
        return { hasError: true, message: error.message, stack: error.stack };
      }
    });
    console.log('-------------------');
    console.log(JSON.stringify(storiesWrapper));
    console.log('-------------------');
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
