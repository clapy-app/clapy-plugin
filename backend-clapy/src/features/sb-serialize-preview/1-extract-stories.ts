export {};
// import { HttpException } from '@nestjs/common';
// import { writeFile } from 'fs/promises';
//
// import { CacheAsLRUMap } from '../../common/cache.js';
// import { env } from '../../env-and-config/env.js';
// import { backendDir } from '../../root.js';
// import { handleError } from '../../utils.js';
// import { ErrorResp, extractStoriesPuppeteer } from './1-extract-stories/extract-stories-puppeteer.js';
// import { replaceLocalhostWithDockerHost, runInPuppeteerBrowser } from './puppeteers-utils.js';
// import { SbStoriesWrapper } from './sb-serialize.model.js';
//
// const storiesCache = new CacheAsLRUMap<string, SbStoriesWrapper>();
//
// export async function extractStories(sbUrl: string): Promise<SbStoriesWrapper> {
//   sbUrl = replaceLocalhostWithDockerHost(sbUrl);
//   if (!env.isDev) {
//     return extractStoriesNoCache(sbUrl);
//   }
//   if (!storiesCache.has(sbUrl)) {
//     storiesCache.set(sbUrl, await extractStoriesNoCache(sbUrl));
//   }
//   return storiesCache.get(sbUrl) as SbStoriesWrapper;
// }
//
// async function extractStoriesNoCache(sbUrl: string) {
//   const storiesWrapperOrError: SbStoriesWrapper | ErrorResp = await runInPuppeteerBrowser(
//     sbUrl,
//     extractStoriesPuppeteer,
//     sbUrl,
//   );
//
//   if (isErrorResp(storiesWrapperOrError)) {
//     console.log('Error, stack in browser:', storiesWrapperOrError.stack);
//     if (storiesWrapperOrError.status) {
//       throw new HttpException(storiesWrapperOrError.message, storiesWrapperOrError.status);
//     }
//     throw new Error(storiesWrapperOrError.message);
//   }
//   if (env.isDev) {
//     writeJsonFile(
//       `${backendDir}/stories/${storiesWrapperOrError.title.replace(/[/\\<>"|?*:]/gi, '')}.json`,
//       storiesWrapperOrError,
//     ).catch(handleError);
//   }
//
//   return storiesWrapperOrError;
// }
//
// function isErrorResp(resp: SbStoriesWrapper | ErrorResp): resp is ErrorResp {
//   return (resp as ErrorResp).hasError === true;
// }
//
// async function writeJsonFile(fileName: string, jsonString: any) {
//   await writeFile(fileName, JSON.stringify(jsonString, null, 2));
// }
