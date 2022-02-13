import { entries } from '../../../common/general-utils';
import { RenderContext } from './import-model';
import { CElementNode, CNode, CPseudoElementNode, isCElementNode, isCPseudoElementNode, isCTextNode } from './sb-serialize.model';
import { appendAbsolutelyPositionedNode, appendMargins, applyAutoLayout, applyBackgroundColor, applyBordersToEffects, applyRadius, applyShadowToEffects, applyTransform, cssFontWeightToFigmaValue, cssRGBAToFigmaValue, cssTextAlignToFigmaValue, ensureFontIsLoaded, getSvgNodeFromBackground, Margins, nodeStyles, prepareBorderWidths, prepareFullWidthHeightAttr, prepareMargins, preparePaddings, sizeWithUnitToPx } from './update-canvas-utils';

export async function appendNodes(sbNodes: CNode[], context: RenderContext) {

  const { figmaParentNode, sbParentNode } = context;
  let absoluteElementsToAdd: { node: FrameNode, sbNode: (CElementNode | CPseudoElementNode); }[] = [];
  let previousMargins: Margins | undefined = undefined;

  // TODO append there, and process them after the loop (after text, before absolute positioning).
  // const floatElements = [];
  // TODO append there consecutive inline-block elements if parent is block (to test on jsfiddle how it behaves if the parent is flex or other), as we do for text & inline elements. Consecutive ones should be wrapped in a frame for horizontal autolayout while keeping a vertical autolayout for the rest which is not inline-block. Exception: if all children are inline-block, don't wrap, just set the parent's direction to horizontal.
  // const consecutiveInlineBlocks = [];

  // TODO a mix of multiple inlines and blocks is not handled well. They will all stack as blocks instead of grouping inlines on the same line.

  for (const sbNode of sbNodes) {
    let node: SceneNode | undefined = undefined;
    try {

      if (!isCElementNode(sbNode) && !isCPseudoElementNode(sbNode) && !isCTextNode(sbNode)) {
        console.warn('Unknown node type:', (sbNode as any).type, '- skipping.');
        continue;
      }

      // Replace inherited styleRules with parent's, before reading any value
      if (isCElementNode(sbNode) || isCPseudoElementNode(sbNode)) {
        for (const [ruleName, value] of entries(sbNode.styleRules)) {
          if (value === 'inherit') {
            // @ts-ignore
            sbNode.styleRules[ruleName] = sbParentNode?.styleRules[ruleName] || sbParentNode?.styles[ruleName];
          }
        }
      }

      const { display, width, height, fontSize, fontWeight, lineHeight, textAlign, color, backgroundColor, opacity, boxShadow, backgroundImage, transform, position, boxSizing, textDecorationLine, overflowX, overflowY } = nodeStyles(sbNode, context.sbParentNode);

      if ((isCTextNode(sbNode) || display === 'inline') && !context.previousInlineNode) {
        // Mutate the current loop context to reuse the node in the next loop runs
        context.previousInlineNode = newTextNode();
      }

      const { previousInlineNode } = context;

      if (isCTextNode(sbNode)) {
        // Have a look at createTextStyle?

        node = previousInlineNode!;
        const start = node.characters.length;
        if (typeof start !== 'number') {
          console.warn('Cannot read characters length from previousInlineNode. length:', start, 'characters:', node.characters);
        }
        let characters = sbNode.value;
        if (typeof characters !== 'string') {
          console.warn('sbNode.value is not a valid string:', characters);
          characters = '';
        }
        if (!characters) {
          // Empty text node, we skip it.
          continue;
        }

        const len = characters?.length;
        const end = start + len;

        const fontName = start > 0 ? node.getRangeFontName(0, 1) : node.fontName;
        const family = (<FontName>fontName).family;
        const fontStyle = cssFontWeightToFigmaValue(fontWeight as string);

        await ensureFontIsLoaded(family, 'Regular');
        const newFont = await ensureFontIsLoaded(family, fontStyle);

        node.insertCharacters(start, characters);

        node.setRangeFontName(start, end, newFont);

        node.setRangeFontSize(start, end, sizeWithUnitToPx(fontSize!));

        if (textDecorationLine === 'underline') {
          node.setRangeTextDecoration(start, end, 'UNDERLINE');
        }

        if (lineHeight !== 'normal') {
          node.setRangeLineHeight(start, end, { value: sizeWithUnitToPx(lineHeight as string), unit: 'PIXELS' });
        }

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

        prepareFullWidthHeightAttr(context, sbNode);
        const borders = prepareBorderWidths(sbNode.styles);
        const paddings = preparePaddings(sbNode.styles, borders);
        const margins = prepareMargins(sbNode.styles);

        const svgNode = getSvgNodeFromBackground(backgroundImage, borders, paddings, sbNode);
        node = svgNode || figma.createFrame();

        node.name = isCElementNode(sbNode) && sbNode.className ? `${sbNode.name}.${sbNode.className.split(' ').join('.')}` : sbNode.name;

        if (display === 'none') {
          node.visible = false;
        }

        // if (node.name === 'i.v-icon.notranslate.mdi.mdi-account-check-outline.theme--light') {
        //   console.log('I want to debug here');
        //   debugger;
        // }

        const { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth } = borders;
        const { paddingBottom, paddingLeft, paddingTop, paddingRight } = paddings;
        const cssWidth = sizeWithUnitToPx(width!);
        const cssHeight = sizeWithUnitToPx(height!);
        // In figma, inside borders are on top of the padding, although in CSS it's an extra layer.
        // So we increase the padding to cover the borders. It also affects the width/height.
        let w = cssWidth + borderLeftWidth + borderRightWidth
          + (boxSizing! === 'content-box' ? paddingLeft + paddingRight : 0);
        let h = cssHeight + borderTopWidth + borderBottomWidth
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

        // Workaround: remove negative margins from width/height (not the real spec behavior)
        if (margins.marginLeft < 0) w += margins.marginLeft;
        if (margins.marginRight < 0) w += margins.marginRight;
        if (margins.marginTop < 0) h += margins.marginTop;
        if (margins.marginBottom < 0) h += margins.marginBottom;

        // if (!isNaN(w) && !isNaN(h)) {
        //   node.resizeWithoutConstraints(w, h);
        // }

        const hasChildren = isCElementNode(sbNode) && !!sbNode.children;
        if (w === 0 && h === 0 && !hasChildren) {
          node.visible = false;
        } else {
          if (w === 0) w = 0.01;
          if (h === 0) h = 0.01;
          applyAutoLayout(node, context, sbNode, paddings, svgNode, w, h);
        }

        appendMargins(context, sbNode, margins, previousMargins);
        previousMargins = margins;

        applyBackgroundColor(node, backgroundColor, opacity);

        const effects: Effect[] = [];

        applyBordersToEffects(node, sbNode.styles, borders, effects);

        applyShadowToEffects(boxShadow as string, effects);

        node.effects = effects;

        applyTransform(transform, node);

        applyRadius(node, sbNode.styles);

        node.clipsContent = (overflowX === 'hidden' || overflowX === 'clip') && (overflowY === 'hidden' || overflowY === 'clip');

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
    } catch (err) {
      console.error('Error while rendering story', context.storyId, ' sbNode', sbNode);

      try {
        // Clean nodes not appended yet because of errors
        if (node && !node.removed) {
          node.remove();
        }
        if (context.previousInlineNode && !context.previousInlineNode.removed) {
          context.previousInlineNode.remove();
        }
      } catch (error) {
        console.warn('Failed to clean up node', node?.name, 'or temporary inline node `previousInlineNode` in the error catch. Sub-error:', error);
      }

      throw err;
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