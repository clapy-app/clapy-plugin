import { isNonEmptyObject } from '../../../../common/general-utils';
import type { SbStoriesWrapper } from '../../../../common/sb-serialize.model';
import { sanitizeSbUrl } from '../../../../common/storybook-utils';
import { env } from '../../../../environment/env';
import type { FrameCreated, StoryEntries } from './3-import-sb-detail';
import { createFrames, getOrCreatePage } from './3-import-sb-detail';
import { storiesSamples } from './import-model';

export function getStoriesSamples() {
  return storiesSamples as Required<typeof storiesSamples>;
}

export async function importStories(sbUrl: string, storiesWrapper: SbStoriesWrapper): Promise<FrameCreated[]> {
  try {
    const { title, stories } = storiesWrapper;
    sbUrl = sanitizeSbUrl(sbUrl);
    const storyEntries: StoryEntries = Object.entries(stories)
      // Alternative: filter on !story.parameters.docsOnly
      .filter(([_, story]) => story.parameters?.__isArgsStory || isNonEmptyObject(story.parameters?.argTypes));

    // Dev filters
    // .filter(([storyId, _]) => storyId === 'components-button--button');
    // .slice(0, 1)

    const page = getOrCreatePage(sbUrl);
    page.setPluginData('sbUrl', sbUrl);
    page.setPluginData('baseUrl', '');
    page.name = `Design System (${title})`;
    if (env.isDev) {
      page.name += ' (dev)';
    }
    page.setRelaunchData({ open: '' });
    figma.currentPage = page;

    // Create placeholders for components that will be imported.
    return createFrames(storyEntries, sbUrl, page);
  } finally {
    figma.commitUndo();
  }
}

export function detachPage() {
  const page = figma.currentPage;
  page.setRelaunchData({});
  page.setPluginData('sbUrl', '');
  page.name = `${page.name} - detached`;
}
