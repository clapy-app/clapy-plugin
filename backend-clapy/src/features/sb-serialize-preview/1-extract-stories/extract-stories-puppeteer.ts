import { SbStories, SbStoriesWrapper, SbStoriesWrapperInput } from '../sb-serialize.model';

export async function extractStoriesPuppeteer(sbUrl: string) {
  try {
    let setStories: [SbStoriesWrapperInput];
    // For some storybooks, the variable is not immediately ready. Let's wait at most one second.
    // (yes, it's ugly, but I don't have better ideas for the MVP.)
    let i = 0;
    const w = window as any;
    if (!w.__STORYBOOK_ADDONS) {
      throw {
        message:
          'This URL is either not a storybook or a version not supported. Please let us know if this is supposed to work.',
        status: 400,
      };
    }
    while (!(setStories = w.__STORYBOOK_ADDONS.channel.data.setStories) && i < 20) {
      ++i;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    const brandTitle = w.__STORYBOOK_ADDONS.config?.theme?.brandTitle || sbUrl;
    if (!setStories) {
      return { hasError: true, message: 'setStories still not defined in puppeteer after 20 tries.' } as ErrorResp;
    }
    if (!setStories[0]) {
      return {
        hasError: true,
        message: 'setStories is defined, but is an empty array. Cannot read the list of stories.',
      } as ErrorResp;
    }

    const { v, stories: storiesRaw } = setStories[0]; /* as SbStoriesWrapper */
    const stories: SbStories = {};
    for (const {
      // argTypes,
      // args,
      componentId,
      initialArgs,
      id,
      kind,
      name,
      parameters,
      story,
      title,
    } of Object.values(storiesRaw)) {
      const {
        // docs,
        // docsOnly,
        // fileName,
        // framework,
        // options,
        // themes,
        // viewMode,
        // __id,
        argTypes,
        __isArgsStory,
      } = parameters || {};
      // const {
      //   iframeHeight,
      //   inlineStories
      // } = docs || {};
      stories[id] = {
        // argTypes,
        // args: JSON.parse(JSON.stringify(args)), // may contain functions, e.g. onClick handler.
        componentId,
        initialArgs,
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
          argTypes,
          __isArgsStory,
        },
        story,
        title,
      };
    }
    return { v, stories, title: brandTitle } as SbStoriesWrapper;
  } catch (error: any) {
    return { hasError: true, message: error.message, stack: error.stack, status: error.status } as ErrorResp;
  }
}

export interface ErrorResp {
  hasError: true;
  message: string;
  stack?: string;
  status?: number;
}
