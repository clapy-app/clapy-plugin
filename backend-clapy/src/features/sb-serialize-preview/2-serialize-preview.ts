import { CacheAsLRUMap } from '../../common/cache';
import { env } from '../../env-and-config/env';
import { FontFamilyToFontMap, prepareSVGFontsMap } from './2-serialize-preview/font/prepare-context';
import { processSVG } from './2-serialize-preview/font/process-node';
import { processImage } from './2-serialize-preview/image/process-node';
import { serializePreviewPuppeteer } from './2-serialize-preview/serialize-preview-puppeteer';
import { replaceLocalhostWithDockerHost, runInPuppeteerBrowser } from './puppeteers-utils';
import { CNode, cssDefaults, CSSStyleDeclarationNoMethod, isCElementNode } from './sb-serialize.model';

const serializeCache = new CacheAsLRUMap<string, CNode[]>();

export async function sbSerializePreview(url: string): Promise<CNode[]> {
  url = replaceLocalhostWithDockerHost(url);
  if (!env.isDev) {
    return await sbSerializePreviewNoCache(url);
  }
  if (!serializeCache.has(url)) {
    serializeCache.set(url, await sbSerializePreviewNoCache(url));
  }
  return serializeCache.get(url) as CNode[];
}

// Extend this context with your specific needs to parse the node tree.
export interface NodeParseContext {
  url: string;
  baseUrl: string;
  fontFaces: CSSStyleDeclarationNoMethod[];

  // Additions from parsers. Parsers are responsible for filling them in preparation phase and ensure the type is correct when parsing.
  fontsMap: FontFamilyToFontMap;
}

async function sbSerializePreviewNoCache(url: string): Promise<CNode[]> {
  const { nodes, fontFaces } = await runInPuppeteerBrowser(url, serializePreviewPuppeteer, cssDefaults);
  const baseUrl = url.substring(0, url.lastIndexOf('/'));
  const context = {
    url,
    baseUrl,
    fontFaces,
  } as NodeParseContext;

  // Hook preparations before parsing
  await prepareSVGFontsMap(context);

  await parseNodes(nodes, context);
  return nodes;
}

async function parseNodes(nodes: CNode[] | undefined, context: NodeParseContext) {
  if (!nodes) return;
  // We could parallelize node processing since it's async (http fetches), but beware of memory consumption.
  // The top would be to have a pool (e.g. of promises).
  // Let's keep it synchronous for now.
  for (const node of nodes) {
    // Hook parsings
    processSVG(node, context);
    await processImage(node, context);

    if (isCElementNode(node)) {
      await parseNodes(node.children, context);
    }
  }
}
