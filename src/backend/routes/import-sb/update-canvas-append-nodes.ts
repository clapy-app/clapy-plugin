import { CNode, isCElementNode, isCTextNode } from './sb-serialize.model';
import { applyBorders, applyShadow, cssFontWeightToFigmaValue, cssRGBAToFigmaValue, cssTextAlignToFigmaValue, sizeWithUnitToPx } from './update-canvas-utils';

const loadedFonts = new Set();

export async function appendNodes(figmaParentNode: FrameNode, sbNodes: CNode[]) {

  for (const sbNode of sbNodes) {

    if (!isCElementNode(sbNode) && !isCTextNode(sbNode)) {
      console.warn('Unknown node type:', (sbNode as any).type, '- skipping.');
      continue;
    }

    const { display, flexDirection, width, height, paddingBottom, paddingLeft, paddingRight, paddingTop, fontSize, fontWeight, lineHeight, textAlign, color, backgroundColor, boxShadow } = sbNode.styles;

    if (isCTextNode(sbNode)) {
      const node = figma.createText();
      node.name = 'text';

      const family = (<FontName>node.fontName).family;
      const style = cssFontWeightToFigmaValue(fontWeight as string);
      const fontCacheKey = `${family}_${style}`;
      const newFont: FontName = { family, style };
      if (!loadedFonts.has(fontCacheKey)) {
        await figma.loadFontAsync(newFont);
        loadedFonts.add(fontCacheKey);
      }
      node.fontName = newFont;

      node.characters = sbNode.value;

      node.fontSize = sizeWithUnitToPx(fontSize!);

      node.lineHeight = { value: sizeWithUnitToPx(lineHeight as string), unit: 'PIXELS' };

      node.textAlignHorizontal = cssTextAlignToFigmaValue(textAlign);

      const { r, g, b, a } = cssRGBAToFigmaValue(color as string);
      node.fills = a > 0 ? [{
        type: 'SOLID',
        color: { r, g, b },
        opacity: a,
      }] : [];

      // node.layoutAlign
      figmaParentNode.appendChild(node);
    } else {
      const node = figma.createFrame();
      node.name = sbNode.name;

      if (display === 'none') {
        node.visible = false;
      }

      const w = sizeWithUnitToPx(width!);
      const h = sizeWithUnitToPx(height!);
      if (!isNaN(w) && !isNaN(h)) {
        node.resizeWithoutConstraints(w, h);
      }

      node.layoutMode = display === 'flex' && flexDirection === 'row'
        ? 'HORIZONTAL' : 'VERTICAL';

      // node.counterAxisSizingMode = 'AUTO';
      // node.primaryAxisSizingMode = 'AUTO';
      if (node.layoutMode === 'VERTICAL') {
        node.layoutAlign = 'STRETCH';
      }

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
        await appendNodes(node, sbNode.children);
      }
    }

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