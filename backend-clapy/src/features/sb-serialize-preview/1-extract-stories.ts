import { writeFile } from 'fs/promises';
import { CacheAsLRUMap } from '../../common/cache';
import { env } from '../../environment/env';
import { projectPath } from '../../root';
import { handleError } from '../../utils';
import { ErrorResp, extractStoriesPuppeteer } from './1-extract-stories/extract-stories-puppeteer';
import { replaceLocalhostWithDockerHost, runInPuppeteerBrowser } from './puppeteers-utils';
import { SbStoriesWrapper } from './sb-serialize.model';

const storiesCache = new CacheAsLRUMap<string, SbStoriesWrapper>();

export async function extractStories(sbUrl: string): Promise<SbStoriesWrapper> {
  sbUrl = replaceLocalhostWithDockerHost(sbUrl);
  if (!env.isDev) {
    return extractStoriesNoCache(sbUrl);
  }
  if (!storiesCache.has(sbUrl)) {
    storiesCache.set(sbUrl, await extractStoriesNoCache(sbUrl));
  }
  return storiesCache.get(sbUrl) as SbStoriesWrapper;
}

async function extractStoriesNoCache(sbUrl: string) {
  const storiesWrapperOrError: SbStoriesWrapper | ErrorResp = await runInPuppeteerBrowser(sbUrl, extractStoriesPuppeteer, sbUrl);

  if (isErrorResp(storiesWrapperOrError)) {
    console.log('Error, stack in browser:', storiesWrapperOrError.stack);
    throw new Error(storiesWrapperOrError.message);
  }
  if (env.isDev) {
    writeJsonFile(
      `${projectPath}/stories/${storiesWrapperOrError.title.replace(
        /[/\\<>"|?*:]/gi,
        '',
      )}.json`,
      storiesWrapperOrError,
    ).catch(handleError);
  }

  return storiesWrapperOrError;
}

function isErrorResp(resp: SbStoriesWrapper | ErrorResp): resp is ErrorResp {
  return (resp as ErrorResp).hasError === true;
}

async function writeJsonFile(fileName: string, jsonString: any) {
  await writeFile(fileName, JSON.stringify(jsonString, null, 2));
}
