import { Property } from 'csstype';
import { Nil } from '../../../common/app-models';
import { entries } from '../../../common/general-utils';
import { RenderContext } from './import-model';
import { CElementNode, CNode, CPseudoElementNode, ELEMENT_NODE, isCElementNode, isCPseudoElementNode, isCTextNode, MyStyles } from './sb-serialize.model';
import { appendAbsolutelyPositionedNode, appendBackgroundColor, appendBackgroundImage, appendMargins, applyAutoLayout, applyBordersToEffects, applyFlexWidthHeight, applyRadius, applyShadowToEffects, applyTransform, calcTextAlignVertical, cssFontWeightToFigmaValue, cssRGBAToFigmaValue, ensureFontIsLoaded, getSvgNode, Margins, nodeStyles, prepareBorderWidths, prepareFullWidthHeightAttr, prepareMargins, preparePaddings, sizeWithUnitToPx, withDefaultProps } from './update-canvas-utils';
import { cssToFontStyle } from './update-canvas/fonts';

type MyNode = TextNode | FrameNode;

export async function appendNodes(sbNodes: CNode[], context: RenderContext) {

  const { figmaParentNode, sbParentNode } = context;
  let absoluteElementsToAdd: { node: FrameNode, sbNode: (CElementNode | CPseudoElementNode); }[] = [];
  let previousMargins: Margins | undefined = undefined;

  const consecutiveInlineNodes: MyNode[] = [];

  // TODO append there, and process them after the loop (after text, before absolute positioning).
  // const floatElements = [];

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

      const { display, width, height, fontSize, fontFamily, fontStretch, fontWeight, fontStyle, lineHeight, color, backgroundColor, opacity, boxShadow, transform, position, boxSizing, textDecorationLine, overflowX, overflowY } = nodeStyles(sbNode, context.sbParentNode);

      if (display === 'none') {
        // Let's skip the elements not displayed for now. We will see later if there is a good reason to render them.
        continue;
      }

      let isFirstTextFragment = false;

      if ((isCTextNode(sbNode) || display === 'inline') && !context.previousInlineNode) {
        // Mutate the current loop context to reuse the node in the next loop runs
        context.previousInlineNode = newTextNode();
        isFirstTextFragment = true;
      }

      if (isCTextNode(sbNode)) {
        // Have a look at createTextStyle?

        node = context.previousInlineNode!;
        const start = node.characters.length;
        if (typeof start !== 'number') {
          console.warn('Cannot read characters length from previousInlineNode. length:', start, 'characters:', node.characters);
        }
        let characters = sbNode.value?.replace(/\s+/g, ' ');
        if (typeof characters !== 'string') {
          console.warn('sbNode.value is not a valid string:', characters);
          characters = '';
        }
        if (isFirstTextFragment) characters = characters.trimStart();
        if (!characters) {
          // Empty text node, we skip it.
          continue;
        }

        const len = characters?.length;
        const end = start + len;

        const defaultFontFamily = ((start > 0 ? node.getRangeFontName(0, 1) : node.fontName) as FontName).family;
        const fontStyleFigma = cssFontWeightToFigmaValue(fontWeight as string);
        const loadedFont = await cssToFontStyle(fontFamily, fontStretch, fontWeight, fontStyle);
        const font: FontName = loadedFont || { family: defaultFontFamily, style: fontStyleFigma };

        if (font.family !== defaultFontFamily || font.style !== 'Regular') {
          await ensureFontIsLoaded({ family: defaultFontFamily, style: 'Regular' });
        }
        await ensureFontIsLoaded(font);

        node.insertCharacters(start, characters);

        node.setRangeFontName(start, end, font);

        node.setRangeFontSize(start, end, sizeWithUnitToPx(fontSize!));

        if (textDecorationLine === 'underline') {
          node.setRangeTextDecoration(start, end, 'UNDERLINE');
        } else {
          // It seems to inherit from the decoration of the previous text, so we explicitly define "none".
          node.setRangeTextDecoration(start, end, 'NONE');
        }

        if (lineHeight !== 'normal') {
          node.setRangeLineHeight(start, end, { value: sizeWithUnitToPx(lineHeight as string), unit: 'PIXELS' });
        }

        const [textAlignHorizontal, textAlignVertical] = calcTextAlignVertical(node, context, sbNode);
        node.textAlignHorizontal = textAlignHorizontal;
        node.textAlignVertical = textAlignVertical;

        const { r, g, b, a } = cssRGBAToFigmaValue(color as string);
        node.setRangeFills(start, end, a > 0 ? [{
          type: 'SOLID',
          color: { r, g, b },
          opacity: a,
        }] : []);

        applyFlexWidthHeight(node, context, sbNode, true, true, false, false);

      } else if (isCElementNode(sbNode) && display === 'inline') {
        // Inline pseudo-elements may be considered as well.

        if (sbNode.children) {
          await appendNodes(sbNode.children, {
            ...context,
            sbParentNode: sbNode,
            // figmaParentNode does not change
            // previousInlineNode does not change
          });
        }

      } else { // sbNode is element or pseudo-element

        prepareFullWidthHeightAttr(context, sbNode);
        const borders = prepareBorderWidths(sbNode.styles);
        const paddings = preparePaddings(sbNode.styles, borders);
        const margins = prepareMargins(sbNode.styles);

        const svgNode = getSvgNode(borders, paddings, sbNode);
        node = svgNode || figma.createFrame();

        // Bug: className is an object for SVG?
        // Reactstrap, component components-toast--toast-header-icon
        node.name = isCElementNode(sbNode) && typeof sbNode.className === 'string' ? `${sbNode.name}.${sbNode.className.split(' ').join('.')}` : sbNode.name;

        // if (display === 'none') {
        //   node.visible = false;
        // }

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

        // Workaround: remove negative margins from width/height (not the real spec behavior)
        if (margins.marginLeft < 0) w += margins.marginLeft;
        if (margins.marginRight < 0) w += margins.marginRight;
        if (margins.marginTop < 0) h += margins.marginTop;
        if (margins.marginBottom < 0) h += margins.marginBottom;

        const hasChildren = isCElementNode(sbNode) && !!sbNode.children;
        if (w === 0 && h === 0 && !hasChildren) {
          node.visible = false;
        } else {
          // `<=` because, with negative margins, negative dimensions can happen.
          if (w <= 0) w = 0.01;
          if (h <= 0) h = 0.01;
          applyAutoLayout(node, context, sbNode, paddings, svgNode, w, h);
        }

        appendMargins(context, sbNode, margins, previousMargins);
        previousMargins = margins;

        node.opacity = parseFloat(opacity as string);

        const fills: Paint[] = [];
        appendBackgroundColor(backgroundColor, fills);

        appendBackgroundImage(sbNode, fills);
        node.fills = fills;

        const effects: Effect[] = [];

        applyBordersToEffects(node, sbNode.styles, borders, effects);

        applyShadowToEffects(boxShadow as string, effects);

        node.effects = effects;

        applyTransform(transform, node);

        applyRadius(node, sbNode.styles);

        node.clipsContent = (overflowX === 'hidden' || overflowX === 'clip') && (overflowY === 'hidden' || overflowY === 'clip');

        if (position === 'absolute') {
          absoluteElementsToAdd.push({ node, sbNode });

        } else {

          queueTextNodeInInlineNodes(context, consecutiveInlineNodes);

          if (hasBlockParent(sbParentNode) && isInline(display)) {
            // Inline is only applicable if the parent is a block
            queueInlineNode(consecutiveInlineNodes, node);
          } else {
            appendInlineNodes(context, consecutiveInlineNodes);
            figmaParentNode.appendChild(node);
          }
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

  queueTextNodeInInlineNodes(context, consecutiveInlineNodes);
  appendInlineNodes(context, consecutiveInlineNodes);

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

function queueTextNodeInInlineNodes(context: RenderContext, inlineNodes: MyNode[]) {
  const { previousInlineNode } = context;
  if (previousInlineNode) {
    queueInlineNode(inlineNodes, previousInlineNode);
    context.previousInlineNode = undefined;
  }
}

function queueInlineNode(inlineNodes: MyNode[], node: TextNode | FrameNode) {
  inlineNodes.push(node);
}

function appendInlineNodes(context: RenderContext, inlineNodes: MyNode[]) {
  const { sbParentNode, figmaParentNode } = context;
  if (!inlineNodes?.length) {
    return;
  }
  if (!hasBlockParent(sbParentNode)) {
    console.warn('Has inline elements to append, but the parent is not a block. Bug!');
  }

  let wrapper = figmaParentNode;
  if (inlineNodes.length > 1) {
    wrapper = withDefaultProps(figma.createFrame());
    wrapper.name = 'Inline wrapper';
    wrapper.layoutMode = 'HORIZONTAL';

    const sbNode = {
      styles: {
        display: 'block',
      } as MyStyles,
      type: ELEMENT_NODE,
      children: [{}] as CNode[], // Fake a non-empty array so that hug contents works
    } as CElementNode;
    applyFlexWidthHeight(wrapper, context, sbNode, true, false, false, false);
    figmaParentNode.appendChild(wrapper);
  } else {
    // TODO check those empty texts and why a text already handled is here.
    console.log(inlineNodes[0]);
  }
  // TODO margins

  for (const node of inlineNodes) {
    wrapper.appendChild(node);
  }

  // Empty the array
  inlineNodes.length = 0;
}

function hasBlockParent(sbParentNode: CElementNode | Nil) {
  return !sbParentNode || sbParentNode.styles.display === 'block' || sbParentNode.styles.display === 'inline-block';
}

function isInline(display: Property.Display) {
  return display.startsWith('inline');
}
