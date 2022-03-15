import { Font } from 'opentype.js';
import { unquoteAndTrimString } from '../../../../utils';
import { NodeParseContext } from '../../2-serialize-preview';
import { Dict } from '../../sb-serialize.model';
import { loadFromUrl } from './load-font';

export type FontFamilyToFontMap = Dict<Font>;
type FontFormat = 'woff' | 'truetype';
const supportedFontFormats = new Set<FontFormat>(['woff', 'truetype']);
const isAbsoluteRegex = new RegExp('^(?:[a-z]+:)?//', 'i');

export async function prepareSVGFontsMap(context: NodeParseContext) {
  const { baseUrl, fontFaces } = context;
  const fontsMap: FontFamilyToFontMap = {};

  for (const fontFace of fontFaces) {
    if (!fontFace.fontFamily) {
      console.error('Font face has no font family name:');
      try {
        console.error(JSON.stringify(fontFace));
      } catch (error) {
        console.error('(recursive object, cannot stringify)');
        console.error(fontFace);
      }
      continue;
    }
    if (!fontFace.src) {
      console.error('Font face has no src:');
      try {
        console.error(JSON.stringify(fontFace));
      } catch (error) {
        console.error('(recursive object, cannot stringify)');
        console.error(fontFace);
      }
      continue;
    }
    const fontSrcRegex =
      /(format\("([^"]+)"\))?\s*url\("([^"]+)"\)\s*(format\("([^"]+)"\))?/g;
    let fontToLoadUrlPath: string | undefined = undefined;
    let fontToLoadFormat: FontFormat | undefined = undefined;

    let match: RegExpExecArray | null;
    while ((match = fontSrcRegex.exec(fontFace.src))) {
      const format = (match[2] || match[5]) as FontFormat;
      if (
        supportedFontFormats.has(format) &&
        (!fontToLoadFormat ||
          (format === 'woff' && fontToLoadFormat !== 'woff'))
      ) {
        // We prioritize the woff format over truetype (ttf).
        fontToLoadFormat = format;
        const urlPath = match[3];
        fontToLoadUrlPath = urlPath;
      }
    }

    if (!fontToLoadUrlPath) {
      console.error(
        'Unsupported font face, it probably does not have a supported format:',
      );
      try {
        console.error(JSON.stringify(fontFace));
      } catch (error) {
        console.error('(recursive object, cannot stringify)');
        console.error(fontFace);
      }
      continue;
    }
    const isAbsolute = isAbsoluteRegex.test(fontToLoadUrlPath);
    let fontUrl = isAbsolute
      ? fontToLoadUrlPath
      : `${baseUrl}/${fontToLoadUrlPath}`;
    if (fontUrl.startsWith('//')) {
      fontUrl = `${new URL(baseUrl).protocol}${fontUrl}`;
    }
    const font = await loadFromUrl(fontUrl);
    fontsMap[unquoteAndTrimString(fontFace.fontFamily)] = font;
  }

  context.fontsMap = fontsMap;

  // To support woff2, other libraries that can load fonts:
  // https://github.com/foliojs/fontkit
  // https://github.com/bramstein/opentype
  // (src: https://github.com/opentypejs/opentype.js/issues/183)
}
