export {};
// To use later, I have a fork of opentype.js that allows fetching on nodejs:
// https://github.com/antoineol/opentype.js
// Command to install:
// yarn add https://github.com/antoineol/opentype.js#feat--loadFromUrl-on-node.js
// It creates the entry in package.json:
// "opentype.js": "https://github.com/antoineol/opentype.js#feat--loadFromUrl-on-node.js",
// import type { Font } from 'opentype.js';
// import { load } from 'opentype.js';
//
// const loadFromUrl0 = load as (url: string, callback?: never, options?: { isUrl?: boolean }) => Promise<Font>;
//
// export function loadFromUrl(url: string) {
//   return loadFromUrl0(url, undefined, { isUrl: true });
// }
//
// export function fontIconUnicodeToSVG(font: Font, unicode: string) {
//   const fontSize = 72;
//   const fillColor = '#000000';
//   const path = font.getPath(unicode, 0, 0, fontSize);
//
//   const svgPath = path.toSVG(2);
//
//   // The icon is rendered at a weird position, not something directly calculated from the fontSize.
//   // Using the bounding box returned for the path, we can calculate the position and size of the SVG.
//   const { x1, y1, x2, y2 } = path.getBoundingBox();
//   const innerWidth = x2 - x1;
//   const innerHeight = y2 - y1;
//   const marginX = (fontSize - innerWidth) / 2;
//   const marginY = (fontSize - innerHeight) / 2;
//
//   const x = x1 - marginX;
//   const y = y1 - marginY;
//   const width = fontSize;
//   const height = fontSize;
//
//   return `<svg width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" fill="${fillColor}" xmlns="http://www.w3.org/2000/svg">${svgPath}</svg>`;
// }
