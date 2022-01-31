import { RenderContext } from './import-model';
import { CElementNode, CNode, CPseudoElementNode, isCElementNode, isCPseudoElementNode, isCTextNode } from './sb-serialize.model';
import { appendAbsolutelyPositionedNode, appendMargins, applyAutoLayout, applyBackgroundColor, applyBordersToEffects, applyRadius, applyShadowToEffects, applyTransform, cssFontWeightToFigmaValue, cssRGBAToFigmaValue, cssTextAlignToFigmaValue, ensureFontIsLoaded, getSvgNodeFromBackground, Margins, prepareBorderWidths, prepareMargins, preparePaddings, sizeWithUnitToPx } from './update-canvas-utils';

export async function appendNodes(sbNodes: CNode[], context: RenderContext) {

  const { figmaParentNode, sbParentNode } = context;
  let absoluteElementsToAdd: { node: FrameNode, sbNode: (CElementNode | CPseudoElementNode); }[] = [];
  let previousMargins: Margins | undefined = undefined;

  // TODO append there, and process them after the loop (after text, before absolute positioning).
  // const floatElements = [];
  // TODO append there consecutive inline-block elements if parent is block (to test on jsfiddle how it behaves if the parent is flex or other), as we do for text & inline elements. Consecutive ones should be wrapped in a frame for horizontal autolayout while keeping a vertical autolayout for the rest which is not inline-block. Exception: if all children are inline-block, don't wrap, just set the parent's direction to horizontal.
  // const consecutiveInlineBlocks = [];

  for (const sbNode of sbNodes) {

    if (!isCElementNode(sbNode) && !isCPseudoElementNode(sbNode) && !isCTextNode(sbNode)) {
      console.warn('Unknown node type:', (sbNode as any).type, '- skipping.');
      continue;
    }

    const { display, width, height, fontSize, fontWeight, lineHeight, textAlign, color, backgroundColor, boxShadow, backgroundImage, transform, position, boxSizing } = sbNode.styles;

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

      const parentHorizontal = figmaParentNode.layoutMode === 'HORIZONTAL';
      const parentVertical = !parentHorizontal;
      const widthFillContainer = !(sbParentNode?.styles.display === 'inline-block'); // true unless the containing tag is inline-block
      node.layoutAlign = parentVertical && widthFillContainer
        ? 'STRETCH'
        : 'INHERIT';
      node.layoutGrow = parentHorizontal
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

      const borders = prepareBorderWidths(sbNode.styles);
      const paddings = preparePaddings(sbNode.styles, borders);

      const svgNode = getSvgNodeFromBackground(backgroundImage, borders, paddings);
      const node = svgNode || figma.createFrame();
      node.name = sbNode.name;

      if (display === 'none') {
        node.visible = false;
      }

      const { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth } = borders;
      const { paddingBottom, paddingLeft, paddingTop, paddingRight } = paddings;
      const cssWidth = sizeWithUnitToPx(width!);
      const cssHeight = sizeWithUnitToPx(height!);
      // In figma, inside borders are on top of the padding, although in CSS it's an extra layer.
      // So we increase the padding to cover the borders. It also affects the width/height.
      const w = cssWidth + borderLeftWidth + borderRightWidth
        + (boxSizing! === 'content-box' ? paddingLeft + paddingRight : 0);
      const h = cssHeight + borderTopWidth + borderBottomWidth
        + (boxSizing! === 'content-box' ? paddingTop + paddingBottom : 0);
      // Parent nodes are considered 100% width (we'll see if the assumption is wrong).
      // For child nodes, it's considered width: 100% if the width is the same as the parent width minus the padding.
      // If we want those variables, review them using Figma width/height instead, since they are already numbers. Keep in mind that Figma padding includes border width.
      // const isWidth100P = sbParentNode === null
      //   || w === sizeWithUnitToPx(sbParentNode.styles.width!)
      //   - sizeWithUnitToPx(sbParentNode.styles.paddingLeft!)
      //   - sizeWithUnitToPx(sbParentNode.styles.paddingRight!);
      // const isHeight100P = sbParentNode === null
      //   || h === sizeWithUnitToPx(sbParentNode.styles.height!)
      //   - sizeWithUnitToPx(sbParentNode.styles.paddingTop!)
      //   - sizeWithUnitToPx(sbParentNode.styles.paddingBottom!);

      // if (!isNaN(w) && !isNaN(h)) {
      //   node.resize(w, h);
      // }

      applyAutoLayout(node, context, sbNode, paddings, svgNode, w, h);

      const margins = prepareMargins(sbNode.styles);
      appendMargins(context, sbNode, margins, previousMargins);
      previousMargins = margins;

      applyBackgroundColor(node, backgroundColor);

      const effects: Effect[] = [];

      applyBordersToEffects(node, sbNode.styles, borders, effects);

      applyShadowToEffects(boxShadow as string, effects);

      node.effects = effects;

      applyTransform(transform, node);

      applyRadius(node, sbNode.styles);

      if (position !== 'absolute') {
        figmaParentNode.appendChild(node);
      } else {
        absoluteElementsToAdd.push({ node, sbNode });
      }

      if (isCElementNode(sbNode) && sbNode.children) {
        await appendNodes(sbNode.children, {
          ...context,
          figmaParentNode: node,
          sbParentNode: sbNode,
          previousInlineNode: undefined,
          ...((position === 'relative' || position === 'absolute') && {
            absoluteAncestor: node,
            absoluteAncestorBorders: borders,
          }),
        });
      }
    }

  }

  if (context.previousInlineNode) {
    figmaParentNode.appendChild(context.previousInlineNode);
    // previousInlineNode = undefined;
  }

  if (sbNodes.length >= 1) {
    appendMargins(context, sbNodes[sbNodes.length - 1], undefined, previousMargins);
  }

  for (const { node, sbNode } of absoluteElementsToAdd) {
    const { position } = sbNode.styles;
    // If position absolute, let's wrap in an intermediate node which is not autolayout, so that we can set the position of the absolutely-positioned node.
    // We append here so that it's the last thing appended, including the text nodes appended just above. It's required to calculate well the parent node height for absolute positioning with a bottom constraint.
    if (position === 'absolute') {
      appendAbsolutelyPositionedNode(node, sbNode, context);
    }
  }

}

function newTextNode() {
  const node = figma.createText();
  node.name = 'text';
  return node;
}