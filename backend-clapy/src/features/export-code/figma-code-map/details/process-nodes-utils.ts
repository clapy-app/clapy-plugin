import { VectorNode2 } from '../../create-ts-compiler/canvas-utils';

export function readSvg(node: VectorNode2) {
  // Remove width and height from SVG. Let the CSS define it.
  // Useless when using SVGR to create a React component, but useful for masking since we don't use React SVG for masking.
  return node._svg?.replace(/^<svg width="\d+" height="\d+"/, '<svg');
}

const htmlEntitiesMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
};
type htmlEntitiesKeys = keyof typeof htmlEntitiesMap;

// A more complete version, if required: https://www.npmjs.com/package/html-entities
export function escapeHTML(str: string) {
  return str.replace(/[&<>'"]/g, (tag: string) => {
    const res = htmlEntitiesMap[tag as htmlEntitiesKeys];
    return res;
  });
}
