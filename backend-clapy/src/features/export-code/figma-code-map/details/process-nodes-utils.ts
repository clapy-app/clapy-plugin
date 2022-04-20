import { VectorNodeDerived } from '../../create-ts-compiler/canvas-utils';

const svgWidthHeightRegex = /^<svg width="\d+" height="\d+"/;

export function readSvg(node: VectorNodeDerived) {
  // Remove width and height from SVG. Let the CSS define it.
  // Useless when using SVGR to create a React component, but useful for masking since we don't use React SVG for masking.
  let svg = node._svg?.replace(svgWidthHeightRegex, '<svg');

  // Patch viewbox if width or height is smaller than the stroke:
  // extend viewbox size to make the stroke visible, to match Figma behavior.
  // The other part of the patch is in applyWidth (flex.ts).
  svg = patchSvgViewBox(svg, node);

  return svg;
}

const viewBoxRegex2 = /(<svg [^>]*?viewBox=["'])(-?[\d\.]+)[, ]+(-?[\d\.]+)[, ]([\d\.]+)[, ]([\d\.]+)(["'])/;

function patchSvgViewBox(svg: string | undefined, node: VectorNodeDerived) {
  if (!svg) return svg;
  return svg.replace(
    viewBoxRegex2,
    (match: string, begin: string, xStr: string, yStr: string, widthStr: string, heightStr: string, end: string) => {
      const [x, y, width, height] = [parseFloat(xStr), parseFloat(yStr), parseFloat(widthStr), parseFloat(heightStr)];
      if (width != null && height != null) {
        let width2 = width,
          height2 = height;
        if (width2 < node.strokeWeight) {
          width2 = node.strokeWeight;
        }
        if (height2 < node.strokeWeight) {
          height2 = node.strokeWeight;
        }
        if (width2 !== width || height2 !== height) {
          return `${begin}${x} ${y} ${width2} ${height2}${end}`;
        }
      }
      // No override, preserve the original viewbox.
      return match;
    },
  );
}

const htmlEntitiesMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
  '{': '&#123;',
  '}': '&#125;',
};
type EntitiesToEscape = keyof typeof htmlEntitiesMap;
const entities = Object.keys(htmlEntitiesMap) as Array<EntitiesToEscape>;
type htmlEntitiesKeys = EntitiesToEscape;

// A more complete version, if required: https://www.npmjs.com/package/html-entities
export function escapeHTML(str: string) {
  // Escape forbidden characters in HTML
  str = str.replace(new RegExp(`[${entities.join('')}]`, 'g'), (tag: string) => {
    const res = htmlEntitiesMap[tag as htmlEntitiesKeys];
    return res;
  });
  // Replaces all line breaks with HTML tag <br /> to preserve line breaks
  str = str.replace(/\r\n|\r|\n|[\x0B\x0C\u0085\u2028\u2029]/g, '<br />');
  return str;
}
