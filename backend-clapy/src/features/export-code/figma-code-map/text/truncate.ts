import type { NodeContext } from '../../code.model.js';
import type { TextBlock, ValidNode } from '../../create-ts-compiler/canvas-utils.js';
import { isText } from '../../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../../css-gen/css-factories-high.js';
import { isMixed } from '../../gen-node-utils/utils-and-reset.js';

export function applyTruncate(context: NodeContext, node: ValidNode, block: TextBlock) {
  if (isText(node) && node.textTruncation === 'ENDING' && node.textAutoResize === 'HEIGHT' && node.maxLines) {
    if (!block.textInlineWrapperStyles) block.textInlineWrapperStyles = {};
    if (node.maxLines === 1) {
      addStyle(context, node, block.textInlineWrapperStyles, 'white-space', 'nowrap');
      addStyle(context, node, block.textInlineWrapperStyles, 'display', 'block');
      addStyle(context, node, block.textInlineWrapperStyles, 'text-overflow', 'ellipsis');
      addStyle(context, node, block.textInlineWrapperStyles, 'overflow', 'hidden');
      addStyle(context, node, block.textInlineWrapperStyles, 'width', '100%');
      addStyle(context, node, block.textInlineWrapperStyles, 'overflow', 'hidden');
      return true;
    } else if (node.maxLines > 1) {
      addStyle(context, node, block.textInlineWrapperStyles, 'display', '-webkit-box');
      addStyle(context, node, block.textInlineWrapperStyles, 'text-overflow', 'ellipsis');
      addStyle(context, node, block.textInlineWrapperStyles, '-webkit-line-clamp', node.maxLines);
      addStyle(context, node, block.textInlineWrapperStyles, '-webkit-box-orient', 'vertical');
      addStyle(context, node, block.textInlineWrapperStyles, 'overflow', 'hidden');
      addStyle(context, node, block.textInlineWrapperStyles, 'width', '100%');
      return true;
    }
  }
  // Truncated and user-resized height
  else if (isText(node) && node.textTruncation === 'ENDING' && node.textAutoResize === 'TRUNCATE') {
    if (!block.textInlineWrapperStyles) block.textInlineWrapperStyles = {};
    const defaultLineHeight = 1.2; // Not correct, it depends on the font family.
    const fontSize = (isMixed(node.fontSize) ? node._textSegments?.[0].fontSize : node.fontSize) || 12;
    const defaultLineHeightPx = defaultLineHeight * fontSize;
    const lineHeight = isMixed(node.lineHeight)
      ? defaultLineHeightPx
      : node.lineHeight.unit === 'PIXELS'
      ? node.lineHeight.value
      : node.lineHeight.unit === 'PERCENT'
      ? node.lineHeight.value * fontSize
      : defaultLineHeightPx;

    const nbLines = Math.max(Math.floor(node.height / lineHeight), 1);

    addStyle(context, node, block.textInlineWrapperStyles, 'display', '-webkit-box');
    addStyle(context, node, block.textInlineWrapperStyles, 'text-overflow', 'ellipsis');
    addStyle(context, node, block.textInlineWrapperStyles, '-webkit-line-clamp', nbLines);
    addStyle(context, node, block.textInlineWrapperStyles, '-webkit-box-orient', 'vertical');
    addStyle(context, node, block.textInlineWrapperStyles, 'overflow', 'hidden');
    addStyle(context, node, block.textInlineWrapperStyles, 'width', '100%');
    return true;
  }
  return false;
}
