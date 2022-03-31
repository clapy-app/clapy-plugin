import { Property } from 'csstype';

import { Nil } from '../../../common/app-models';
import { entries } from '../../../common/general-utils';
import {
  CElementNode,
  CNode,
  CPseudoElementNode,
  ELEMENT_NODE,
  isCElementNode,
  isCPseudoElementNode,
  isCTextNode,
  MyStyles,
} from '../../../common/sb-serialize.model';
import { isGroup, isText } from '../../common/canvas-utils';
import { RenderContext } from '../1-import-stories/import-model';
import { cssToFontStyle } from './fonts';
import {
  appendBackgroundColor,
  appendBackgroundImage,
  applyAutoLayout,
  applyBordersToEffects,
  applyFlexWidthHeight,
  applyRadius,
  applyShadowToEffects,
  applyTransform,
  calcTextAlignVertical,
  cssFontWeightToFigmaValue,
  cssRGBAToFigmaValue,
  ensureFontIsLoaded,
  getSvgNode,
  nodeStyles,
  prepareBorderWidths,
  prepareFullWidthHeightAttr,
  prepareMargins,
  preparePaddings,
  removeNode,
  sizeWithUnitToPx,
  withDefaultProps,
  wrapWithMargin,
} from './update-canvas-utils';

type MyNode = TextNode | FrameNode | GroupNode;

export async function appendChildNodes(sbNodes: CNode[], context: RenderContext) {
  const {
    figmaParentNode,
    sbParentNode,
    appendInline,
    absoluteElementsToAdd,
    absoluteAncestor,
    absoluteAncestorBorders,
  } = context;

  const consecutiveInlineNodes: MyNode[] = [];

  // TODO append there, and process them after the loop (after text, before absolute positioning).
  // const floatElements = [];

  let i = -1;
  for (const sbNode of sbNodes) {
    ++i;
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
            sbNode.styleRules[ruleName] =
              sbParentNode?.styleRules[ruleName] ||
              // @ts-ignore
              sbParentNode?.styles[ruleName];
          }
        }
      }

      const {
        display,
        width,
        height,
        fontSize,
        fontFamily,
        fontStretch,
        fontWeight,
        fontStyle,
        lineHeight,
        color,
        backgroundColor,
        opacity,
        boxShadow,
        transform,
        position,
        boxSizing,
        textDecorationLine,
        overflowX,
        overflowY,
      } = nodeStyles(sbNode, sbParentNode);

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
        node = context.previousInlineNode!;
        const start = node.characters.length;
        if (typeof start !== 'number') {
          console.warn(
            'Cannot read characters length from previousInlineNode. length:',
            start,
            'characters:',
            node.characters,
          );
        }
        let characters = sbNode.value?.replace(/\s+/g, ' ');
        if (typeof characters !== 'string') {
          console.warn('sbNode.value is not a valid string:', characters);
          characters = '';
        }
        const previousNode: CNode | undefined = sbNodes[i - 1];
        if (!isInlineNode(previousNode)) {
          characters = characters.trimStart();
        }
        const nextNode: CNode | undefined = sbNodes[i + 1];
        if (!isInlineNode(nextNode)) {
          characters = characters.trimEnd();
        }
        if (!characters) {
          // Empty text node, we skip it.
          continue;
        }

        const len = characters?.length;
        const end = start + len;

        const defaultFontFamily = ((start > 0 ? node.getRangeFontName(0, 1) : node.fontName) as FontName).family;
        const fontStyleFigma = cssFontWeightToFigmaValue(fontWeight as string);
        const loadedFont = await cssToFontStyle(fontFamily, fontStretch, fontWeight, fontStyle);
        const font: FontName = loadedFont || {
          family: defaultFontFamily,
          style: fontStyleFigma,
        };

        if (font.family !== defaultFontFamily || font.style !== 'Regular') {
          await ensureFontIsLoaded({
            family: defaultFontFamily,
            style: 'Regular',
          });
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
          node.setRangeLineHeight(start, end, {
            value: sizeWithUnitToPx(lineHeight as string),
            unit: 'PIXELS',
          });
        }

        const [textAlignHorizontal, textAlignVertical] = calcTextAlignVertical(node, context, sbNode);
        node.textAlignHorizontal = textAlignHorizontal;
        node.textAlignVertical = textAlignVertical;

        const { r, g, b, a } = cssRGBAToFigmaValue(color as string);
        node.setRangeFills(
          start,
          end,
          a > 0
            ? [
                {
                  type: 'SOLID',
                  color: { r, g, b },
                  opacity: a,
                },
              ]
            : [],
        );

        // TODO shouldn't we always hug contents? Beware of not breaking components like reactstrap accordion header with icon.
        applyFlexWidthHeight(node, context, sbNode, true, true, false, false);
      } else if (isCElementNode(sbNode) && allChildrenAreTextNodes(sbNode) && display === 'inline') {
        // Inline pseudo-elements may be considered as well.

        if (sbNode.children) {
          await appendChildNodes(sbNode.children, {
            ...context,
            sbParentNode: sbNode,
            appendInline: true,
            // figmaParentNode does not change
            // previousInlineNode does not change
          });
        }
      } else {
        // sbNode is element or pseudo-element

        // Bug: className is an object for SVG?
        // Reactstrap, component components-toast--toast-header-icon
        const className = isCElementNode(sbNode) ? sbNode.className?.trim?.() : undefined;
        const nodeName =
          className && typeof className === 'string' ? `${sbNode.name}.${className.split(' ').join('.')}` : sbNode.name;

        if (appendInline) {
          console.warn(
            'Block elements',
            nodeName,
            'inside inline detected. It is not supported well and will cause unexpected results.',
          );
        }

        prepareFullWidthHeightAttr(context, sbNode);
        const borders = prepareBorderWidths(sbNode.styles);
        const paddings = preparePaddings(sbNode.styles, borders);
        const margins = prepareMargins(sbNode);

        const hasChildren = isCElementNode(sbNode) && !!sbNode.children;

        const svgNode = getSvgNode(borders, paddings, sbNode);
        node = svgNode || withDefaultProps(figma.createFrame());
        node.name = nodeName;

        // if (display === 'none') {
        //   node.visible = false;
        // }

        // if (node.name === 'i.v-icon.notranslate.mdi.mdi-account-check-outline.theme--light') {
        //   console.log('I want to debug here');
        //   debugger;
        // }

        node.opacity = parseFloat(opacity as string);

        const fills: Paint[] = [];
        appendBackgroundColor(backgroundColor, fills);

        appendBackgroundImage(sbNode, fills);

        const effects: Effect[] = [];

        applyBordersToEffects(node, sbNode.styles, borders, effects);

        const forceClipContents = applyShadowToEffects(boxShadow as string, effects, node, fills);

        if (!isGroup(node)) {
          node.fills = fills;
        }

        node.effects = effects;

        applyTransform(transform, node);

        if (!isGroup(node)) {
          applyRadius(node, sbNode.styles);
        }

        if (!isGroup(node)) {
          node.clipsContent =
            forceClipContents ||
            ((overflowX === 'hidden' || overflowX === 'clip') && (overflowY === 'hidden' || overflowY === 'clip'));
        }

        // Layout

        const { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth } = borders;
        const { paddingBottom, paddingLeft, paddingTop, paddingRight } = paddings;
        const cssWidth = sizeWithUnitToPx(width!);
        const cssHeight = sizeWithUnitToPx(height!);
        // In figma, inside borders are on top of the padding, although in CSS it's an extra layer.
        // So we increase the padding to cover the borders. It also affects the width/height.
        let w =
          cssWidth +
          borderLeftWidth +
          borderRightWidth +
          (boxSizing! === 'content-box' ? paddingLeft + paddingRight : 0);
        let h =
          cssHeight +
          borderTopWidth +
          borderBottomWidth +
          (boxSizing! === 'content-box' ? paddingTop + paddingBottom : 0);
        if (display === 'inline' && noTextChild(sbNode)) {
          // font size and line height should be interpreted as width/height
          const lineHeightNum = sizeWithUnitToPx(lineHeight as string);
          w = sizeWithUnitToPx(fontSize);
          if (lineHeightNum > w) {
            if (figmaParentNode.layoutMode === 'HORIZONTAL' && figmaParentNode.counterAxisSizingMode === 'AUTO') {
              figmaParentNode.counterAxisSizingMode = 'FIXED';
              figmaParentNode.counterAxisAlignItems = 'CENTER';
              figmaParentNode.resizeWithoutConstraints(figmaParentNode.width, lineHeightNum);
            } else if (figmaParentNode.layoutMode === 'VERTICAL' && figmaParentNode.primaryAxisSizingMode === 'AUTO') {
              figmaParentNode.primaryAxisSizingMode = 'FIXED';
              figmaParentNode.primaryAxisAlignItems = 'CENTER';
              figmaParentNode.resizeWithoutConstraints(figmaParentNode.width, lineHeightNum);
            } else {
              figmaParentNode.resizeWithoutConstraints(
                figmaParentNode.width,
                Math.max(figmaParentNode.height, lineHeightNum),
              );
            }
          }
          h = Math.min(lineHeightNum, w);
        }

        // `<=` because, with negative margins, negative dimensions can happen.
        if (w < 0.01 && h < 0.01 && !hasChildren) {
          node.visible = false;
        } else {
          applyAutoLayout(node, context, sbNode, paddings, svgNode, w, h);
        }

        // We could reuse this pattern to have all steps using/overriding wrapperNode and innerNode instead of working with node alone.
        let wrapperNode = node;
        let innerNode = node;

        // Last step before append, don't apply any style on the node after:
        ({ wrapperNode, innerNode } = wrapWithMargin(context, node, sbNode, margins));
        // Don't use `node` below, use `wrapperNode` or `innerNode` instead.

        if (position === 'absolute') {
          absoluteElementsToAdd.push({
            node: wrapperNode,
            sbNode,
            figmaParentNode,
            absoluteAncestor,
            absoluteAncestorBorders,
          });
        } else {
          queueTextNodeInInlineNodes(context, consecutiveInlineNodes);

          if (hasBlockParent(sbParentNode) && isInline(display)) {
            // Inline is only applicable if the parent is a block
            queueInlineNode(consecutiveInlineNodes, wrapperNode);
          } else {
            appendInlineNodes(context, consecutiveInlineNodes);
            figmaParentNode.appendChild(wrapperNode);
          }
        }

        // !isGroup(innerNode) explanation: it can be a GroupNode when the node is a SVG. But in that case,
        // it cannot have children. To simplify the typing, let's add the condition here and sbParentNode
        // don't take the GroupNode type.
        if (isCElementNode(sbNode) && sbNode.children && !isGroup(innerNode)) {
          await appendChildNodes(sbNode.children, {
            ...context,
            figmaParentNode: innerNode,
            sbParentNode: sbNode,
            previousInlineNode: undefined,
            ...((position === 'relative' || position === 'absolute') && {
              absoluteAncestor: innerNode,
              absoluteAncestorBorders: borders,
            }),
          });
        }
      }
    } catch (err) {
      console.error('Error while rendering story', context.storyId, ' sbNode', sbNode);

      try {
        // Clean nodes not appended yet because of errors
        removeNode(node);
        removeNode(context.previousInlineNode);
      } catch (error) {
        console.warn(
          'Failed to clean up node',
          node?.name,
          'or temporary inline node `previousInlineNode` in the error catch. Sub-error:',
          error,
        );
      }

      throw err;
    }
  }

  if (!appendInline) {
    queueTextNodeInInlineNodes(context, consecutiveInlineNodes);
    appendInlineNodes(context, consecutiveInlineNodes);
  }
}

function newTextNode() {
  const node = withDefaultProps(figma.createText());
  node.name = 'text';
  return node;
}

function queueTextNodeInInlineNodes(context: RenderContext, inlineNodes: MyNode[]) {
  const { previousInlineNode, sbParentNode, figmaParentNode } = context;
  if (previousInlineNode && !previousInlineNode.removed && previousInlineNode.characters) {
    context.previousInlineNode = undefined;

    if (hasBlockParent(sbParentNode)) {
      queueInlineNode(inlineNodes, previousInlineNode);
    } else {
      figmaParentNode.appendChild(previousInlineNode);
    }
  } else {
    removeNode(previousInlineNode);
    context.previousInlineNode = undefined;
  }
}

function queueInlineNode(inlineNodes: MyNode[], node: TextNode | FrameNode | GroupNode) {
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
  inlineNodes = inlineNodes.filter(n => !isText(n) || !!n.characters);
  if (!inlineNodes?.length) {
    return;
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
  }

  for (const node of inlineNodes) {
    wrapper.appendChild(node);
  }

  // Empty the array
  inlineNodes.length = 0;
}

function hasBlockParent(sbParentNode: CElementNode | Nil) {
  return !sbParentNode || sbParentNode.styles.display === 'block' || sbParentNode.styles.display === 'inline-block';
}

function isInline(display: Property.Display | undefined) {
  return !!display?.startsWith('inline');
}

function isInlineNode(node: CNode) {
  return !!(node && (isCTextNode(node) || isInline(node.styles.display)));
}

function allChildrenAreTextNodes(node: CElementNode) {
  const children = node.children || [];
  if (!children.length) return false;
  for (const child of children) {
    if (!isCTextNode(child)) {
      return false;
    }
  }
  return true;
}

function noTextChild(node: CElementNode | CPseudoElementNode) {
  if (isCPseudoElementNode(node)) {
    return true;
  }
  for (const child of node.children || []) {
    if (isCTextNode(child)) {
      return false;
    }
  }
  return true;
}

// TODO if the parent is empty wrapper, evaluate current node
// Sur un noeud, si le parent n'est pas un empty wrapper, je passe pareil à l'enfant et je saute. Sinon, je vérifie ce noeud et :
// - D'une part, si le contexte n'a pas encore trouvé de non-empty child et que ce noeud est non-empty, je le marque sur le contexte.
// - D'autre part, je passe à l'enfant parent empty ou pas selon ce noeud.

// TODO Il faut d'abord écrire dans le parent parentNonEmptyChildMode plus haut pour propager ?

// En remontant aux parents après la boucle, vérifier le résultat dans le contexte modifié
// Après la boucle des enfants, je vérifie le contexte qui leur a été envoyé. Selon parentNonEmptyChildMode, on propage au contexte parent.
// parent undefined enfant !undefined => copier l'enfant
// parent 'hugContents' enfant 'fillContainer' => copier l'enfant

// TODO... détailler ce qu'il se passe
// À la fin de la boucle des enfants,
// parentNonEmptyChildMode === 'fillContainer'
// parentNonEmptyChildMode === 'hugContents'
// parentNonEmptyChildMode === undefined
