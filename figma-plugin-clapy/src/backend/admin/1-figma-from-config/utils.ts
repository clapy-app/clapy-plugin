//-------------------------------------------------------------------------------------------------------------
//-------------------------------utils functions implementation--------------------------------
//-------------------------------------------------------------------------------------------------------------
const loadedFonts = new Map<string, Promise<void>>();

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
