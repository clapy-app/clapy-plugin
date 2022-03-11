import { MutableRefObject } from 'react';

import { ArgTypeObj } from '../../../common/app-models';
import { apiGet } from '../../../common/http.utils';
import { fetchPlugin } from '../../../common/plugin-utils';
import { Args, ArgTypes, CNode } from '../../../common/sb-serialize.model';
import { env } from '../../../environment/env';
import { buildArgsMatrix } from './buildArgsMatrix';

export async function renderComponent(
  sbUrl: string,
  storyId: string,
  argTypes: ArgTypes,
  storyArgFilters: ArgTypeObj | undefined,
  initialArgs: Args,
  storyUrl: string,
  figmaId: string,
  pageId: string,
  setLoadingTxt: (label: string) => void,
  interruptedRef: MutableRefObject<boolean>,
) {
  if (!env.isDev) {
    setLoadingTxt(`Render story ${storyId}...`);
  }

  // storyArgFilters is undefined when the selection is not a componentSet, i.e. no variant to render.
  const argsMatrix = storyArgFilters ? buildArgsMatrix(argTypes, storyArgFilters, initialArgs) : undefined;
  if (argsMatrix) {
    // Render each variant
    for (let i = 0; i < argsMatrix.length; i++) {
      const row = argsMatrix[i];
      for (let j = 0; j < row.length; j++) {
        if (interruptedRef.current) {
          return;
        }

        const args = row[j];
        const query = Object.entries(args)
          .map(([key, value]) => `${key}:${value}`)
          .join(';');
        const url = `${sbUrl}/iframe.html?id=${storyId}&viewMode=story&args=${query}`;
        if (env.isDev) {
          setLoadingTxt(`Render story ${storyId} variant (web)...`);
        }
        const nodes = await fetchCNodes(url);
        if (env.isDev) {
          setLoadingTxt(`Render story ${storyId} variant (figma)...`);
        }
        const newFigmaId = await fetchPlugin(
          'updateCanvasVariant',
          nodes,
          figmaId,
          sbUrl,
          storyId,
          pageId,
          argTypes,
          initialArgs,
          args,
          i,
          j,
        );
        if (newFigmaId) {
          figmaId = newFigmaId; // TODO tester
        }
      }
    }
  } else {
    if (env.isDev) {
      setLoadingTxt(`Render story ${storyId} (web)...`);
    }

    // Render the story in the API in web format via puppeteer and get HTML/CSS
    const nodes = await fetchCNodes(storyUrl);

    if (env.isDev) {
      setLoadingTxt(`Render story ${storyId} (figma)...`);
    }

    // Render in Figma, translating HTML/CSS to Figma nodes
    await fetchPlugin('updateCanvas', nodes, figmaId, storyId, pageId);
  }
}

async function fetchCNodes(url: string) {
  return (await apiGet<CNode[]>('stories/serialize', { query: { url } })).data;
}
