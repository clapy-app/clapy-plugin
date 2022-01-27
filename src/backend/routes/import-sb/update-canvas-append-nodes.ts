import { CNode, isCElementNode, isCTextNode } from './sb-serialize.model';
import { applyBorders, applyFlexWidthHeight, applyShadow, cssFontWeightToFigmaValue, cssRGBAToFigmaValue, cssTextAlignToFigmaValue, sizeWithUnitToPx } from './update-canvas-utils';

const loadedFonts = new Set();

export async function appendNodes(figmaParentNode: FrameNode, sbNodes: CNode[], sbParentNode: CNode | null, previousInlineNode?: TextNode) {

  for (const sbNode of sbNodes) {

    if (!isCElementNode(sbNode) && !isCTextNode(sbNode)) {
      console.warn('Unknown node type:', (sbNode as any).type, '- skipping.');
      continue;
    }

    const { display, flexDirection, width, height, paddingBottom, paddingLeft, paddingRight, paddingTop, fontSize, fontWeight, lineHeight, textAlign, color, backgroundColor, boxShadow } = sbNode.styles;

    if ((isCTextNode(sbNode) || display === 'inline') && !previousInlineNode) {
      previousInlineNode = newTextNode();
    }

    if (isCTextNode(sbNode)) {

      const node = previousInlineNode!;
      const start = node.characters.length;
      if (typeof start !== 'number') {
        console.warn('Cannot read characters length from previousInlineNode. length:', start, 'characters:', node.characters);
      }
      const len = sbNode.value.length;
      if (typeof len !== 'number') {
        console.warn('Cannot read length from text value. length:', len, 'characters:', sbNode.value);
      }
      const end = start + len;

      const fontName = start > 0 ? node.getRangeFontName(0, 1) : node.fontName;
      const family = (<FontName>fontName).family;
      const style = cssFontWeightToFigmaValue(fontWeight as string);
      const fontCacheKey = `${family}_${style}`;
      const newFont: FontName = { family, style };
      if (!loadedFonts.has(fontCacheKey)) {
        await figma.loadFontAsync(newFont);
        loadedFonts.add(fontCacheKey);
      }

      node.insertCharacters(start, sbNode.value);

      node.setRangeFontName(start, end, newFont);

      node.setRangeFontSize(start, end, sizeWithUnitToPx(fontSize!));

      node.setRangeLineHeight(start, end, { value: sizeWithUnitToPx(lineHeight as string), unit: 'PIXELS' });

      node.textAlignHorizontal = cssTextAlignToFigmaValue(textAlign);

      const { r, g, b, a } = cssRGBAToFigmaValue(color as string);
      node.setRangeFills(start, end, a > 0 ? [{
        type: 'SOLID',
        color: { r, g, b },
        opacity: a,
      }] : []);

      node.layoutAlign = figmaParentNode.layoutMode === 'HORIZONTAL'
        ? 'INHERIT'
        : 'STRETCH';
      node.layoutGrow = figmaParentNode.layoutMode === 'HORIZONTAL'
        ? 1 : 0;

    } else if (display === 'inline') {

      if (sbNode.children) {
        await appendNodes(figmaParentNode, sbNode.children, sbNode, previousInlineNode);
      }

    } else {

      if (previousInlineNode) {
        figmaParentNode.appendChild(previousInlineNode);
        previousInlineNode = undefined;
      }

      const node = figma.createFrame();
      node.name = sbNode.name;

      if (display === 'none') {
        node.visible = false;
      }

      const w = sizeWithUnitToPx(width!);
      const h = sizeWithUnitToPx(height!);
      // Parent nodes are considered 100% width (we'll see if the assumption is wrong).
      // For child nodes, it's considered width: 100% if the width is the same as the parent width minus the padding.
      const isWidth100P = sbParentNode === null
        || w === sizeWithUnitToPx(sbParentNode.styles.width!)
        - sizeWithUnitToPx(sbParentNode.styles.paddingLeft!)
        - sizeWithUnitToPx(sbParentNode.styles.paddingRight!);
      const isHeight100P = sbParentNode === null
        || h === sizeWithUnitToPx(sbParentNode.styles.height!)
        - sizeWithUnitToPx(sbParentNode.styles.paddingTop!)
        - sizeWithUnitToPx(sbParentNode.styles.paddingBottom!);
      // if (!isNaN(w) && !isNaN(h)) {
      //   node.resize(w, h);
      // }

      node.layoutMode = display === 'flex' && flexDirection === 'row'
        ? 'HORIZONTAL' : 'VERTICAL';

      applyFlexWidthHeight(node, figmaParentNode);

      if (paddingBottom) node.paddingBottom = sizeWithUnitToPx(paddingBottom);
      if (paddingLeft) node.paddingLeft = sizeWithUnitToPx(paddingLeft);
      if (paddingTop) node.paddingTop = sizeWithUnitToPx(paddingTop);
      if (paddingRight) node.paddingRight = sizeWithUnitToPx(paddingRight);

      {
        const { r, g, b, a } = cssRGBAToFigmaValue(backgroundColor as string);
        node.fills = a > 0 ? [{
          type: 'SOLID',
          color: { r, g, b },
          opacity: a,
        }] : [];
      }

      const effects: Effect[] = [];

      applyBorders(node, sbNode.styles, effects);

      applyShadow(boxShadow as string, effects);

      node.effects = effects;

      figmaParentNode.appendChild(node);
      if (sbNode.children) {
        await appendNodes(node, sbNode.children, sbNode);
      }
    }

  }

  if (previousInlineNode) {
    figmaParentNode.appendChild(previousInlineNode);
    // previousInlineNode = undefined;
  }

}

// display,
// flexDirection,
// width,
// height,
// fontSize,
// fontWeight,
// lineHeight,
// textAlign,
// color,
// backgroundColor,
// borderColor,
// borderStyle,
// borderWidth,
// position,
// left,
// top,
// right,
// bottom,

function newTextNode() {
  const node = figma.createText();
  node.name = 'text';
  return node;
}