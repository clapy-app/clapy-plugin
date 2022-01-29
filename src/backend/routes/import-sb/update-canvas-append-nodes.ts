import { RenderContext } from './import-model';
import { CNode, isCElementNode, isCPseudoElementNode, isCTextNode } from './sb-serialize.model';
import { applyAbsolutePosition, applyAutoLayout, applyBorders as applyBordersToEffects, applyRadius, applyShadow as applyShadowToEffects, applyTransform, cssFontWeightToFigmaValue, cssRGBAToFigmaValue, cssTextAlignToFigmaValue, ensureFontIsLoaded, getSvgNodeFromBackground, sizeWithUnitToPx } from './update-canvas-utils';

export async function appendNodes(sbNodes: CNode[], context: RenderContext) {

  const { figmaParentNode, sbParentNode } = context;

  for (const sbNode of sbNodes) {

    if (!isCElementNode(sbNode) && !isCPseudoElementNode(sbNode) && !isCTextNode(sbNode)) {
      console.warn('Unknown node type:', (sbNode as any).type, '- skipping.');
      continue;
    }

    const { display, width, height, fontSize, fontWeight, lineHeight, textAlign, color, backgroundColor, boxShadow, backgroundImage, transform, position } = sbNode.styles;

    if ((isCTextNode(sbNode) || display === 'inline') && !context.previousInlineNode) {
      // Mutate the current loop context to reuse the node in the next loop runs
      context.previousInlineNode = newTextNode();
    }

    const { previousInlineNode } = context;

    if (isCTextNode(sbNode)) {
      // Have a look at ShapeWithText and TextStyle (createXX)?

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

      await ensureFontIsLoaded(family, 'Regular');
      const newFont = await ensureFontIsLoaded(family, style);

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

    } else if (isCElementNode(sbNode) && display === 'inline') {

      if (sbNode.children) {
        await appendNodes(sbNode.children, {
          ...context,
          sbParentNode: sbNode,
          // figmaParentNode does not change
          // previousInlineNode does not change
        });
      }

    } else { // sbNode is element or pseudo-element

      if (previousInlineNode) {
        figmaParentNode.appendChild(previousInlineNode);
        context.previousInlineNode = undefined;
      }

      const svgNode = getSvgNodeFromBackground(backgroundImage);
      const node = svgNode || figma.createFrame();
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
      if (!isNaN(w) && !isNaN(h)) {
        node.resize(w, h);
      }

      applyAutoLayout(node, figmaParentNode, sbNode);

      {
        const { r, g, b, a } = cssRGBAToFigmaValue(backgroundColor as string);
        node.fills = a > 0 ? [{
          type: 'SOLID',
          color: { r, g, b },
          opacity: a,
        }] : [];
      }

      const effects: Effect[] = [];

      applyBordersToEffects(node, sbNode.styles, effects);

      applyShadowToEffects(boxShadow as string, effects);

      node.effects = effects;

      applyTransform(transform, node);

      applyRadius(node, sbNode.styles);

      // If position absolute, let's wrap in an intermediate node which is not autolayout, so that we can set the position of the absolutely-positioned node.
      if (position === 'absolute') {
        const wrapper = applyAbsolutePosition(node, figmaParentNode, sbNode);
        wrapper.appendChild(node);
      } else {
        figmaParentNode.appendChild(node);
      }

      if (isCElementNode(sbNode) && sbNode.children) {
        await appendNodes(sbNode.children, {
          ...context,
          figmaParentNode: node,
          sbParentNode: sbNode,
          previousInlineNode: undefined,
        });
      }
    }

  }

  if (context.previousInlineNode) {
    figmaParentNode.appendChild(context.previousInlineNode);
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