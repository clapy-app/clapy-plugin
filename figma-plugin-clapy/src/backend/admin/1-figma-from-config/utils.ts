//-------------------------------------------------------------------------------------------------------------
//-------------------------------utils functions implementation------------------------------------------------
import type { OmitMethods, SVGsExtracted, TextNodeNoMethod } from '../../../common/sb-serialize.model.js';

//-------------------------------------------------------------------------------------------------------------
const loadedFonts = new Map<string, Promise<void>>();

export interface FigmaConfigContext {
  svgs?: SVGsExtracted;
}

export interface TextNode2 extends TextNodeNoMethod {
  _textSegments: StyledTextSegment[];
}

const readOnlyAttributes = [
  'absoluteBoundingBox',
  'absoluteRenderBounds',
  'absoluteTransform',
  'attachedConnectors',
  'backgrounds',
  'children',
  'componentPropertyDefinitions',
  'dashPattern',
  'documentationLinks',
  'effects',
  'exportSettings',
  'fills',
  'guides',
  'height',
  'id',
  'key',
  'layoutGrids',
  'overlayBackground',
  'overlayBackgroundInteraction',
  'overlayPositionType',
  'parent',
  'reactions',
  'remote',
  'removed',
  'strokes',
  'stuckNodes',
  'variantProperties',
  'width',
  'type',
  '_textSegments',
  'pointCount',
  'exportAsSvg',
  'strokeCap',
  'innerRadius',
] as const;

export const ignoredAttributes = new Set<string>(readOnlyAttributes);

type ReadOnlySceneNodeFields = typeof readOnlyAttributes[number];
type WriteableSceneNode = Omit<OmitMethods<SceneNode>, ReadOnlySceneNodeFields>;
export type WriteableSceneNodeKeys = keyof WriteableSceneNode;

export async function ensureFontIsLoaded(font: FontName) {
  const fontCacheKey = `${font.family}_${font.style}`;
  if (!loadedFonts.has(fontCacheKey)) {
    const p = figma.loadFontAsync(font);
    loadedFonts.set(fontCacheKey, p);
    // Loading fonts takes time. We are in a loop and we don't want other loop runs to also load the font. So the cache returns the promise of the font we are already loading, so that everybody awaits a shared font loading.
    await p;
  } else {
    await loadedFonts.get(fontCacheKey);
  }
}

export function cleanUpLastLaunch() {
  for (const page of figma.root.children) {
    if (page.id !== figma.currentPage.id) {
      page.remove();
    }
  }
}
export function appendChild(node: ChildrenMixin, child: SceneNode) {
  node.appendChild(child);
}
