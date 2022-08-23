//-------------------------------------------------------------------------------------------------------------
//-------------------------------child Node generation functions implementation--------------------------------

import { generateParentNode } from './3-create-parent-nodes.js';
import { ensureFontIsLoaded } from './utils.js';

//-------------------------------------------------------------------------------------------------------------
interface textNode2 extends TextNode {
  _textSegments: StyledTextSegment[];
}
export async function generateTextNode(child: textNode2) {
  let element;
  await ensureFontIsLoaded({ family: 'Inter', style: 'Regular' });
  element = figma.createText();
  element.name = child.name;
  element.strokeAlign = child.strokeAlign;
  element.relativeTransform = child.relativeTransform;
  element.x = child.x;
  element.y = child.y;
  element.textAlignHorizontal = child.textAlignHorizontal;
  element.textAlignVertical = child.textAlignVertical;
  element.textAutoResize = child.textAutoResize;
  element.resize(child.width, child.height);
  for (const textSegment of child._textSegments) {
    await ensureFontIsLoaded(textSegment.fontName);
    const start = textSegment.start;
    const end = textSegment.end;
    element.insertCharacters(start, textSegment.characters);
    element.setRangeFontSize(start, end, textSegment.fontSize);
    element.setRangeFontName(start, end, textSegment.fontName);
    element.setRangeTextCase(start, end, textSegment.textCase);
    element.setRangeTextDecoration(start, end, textSegment.textDecoration);
    element.setRangeLetterSpacing(start, end, textSegment.letterSpacing);
    element.setRangeLineHeight(start, end, textSegment.lineHeight);
    element.setRangeHyperlink(start, end, textSegment.hyperlink);
    element.setRangeFills(start, end, textSegment.fills);
    element.setRangeTextStyleId(start, end, textSegment.textStyleId);
    element.setRangeFillStyleId(start, end, textSegment.fillStyleId);
    element.setRangeListOptions(start, end, textSegment.listOptions);
    element.setRangeIndentation(start, end, textSegment.indentation);
  }
  return element;
}

async function generateRectancle(child: RectangleNode) {
  let element;
  element = figma.createRectangle();
  element.name = child.name;
  element.fills = child.fills;
  if (child.x) element.x = child.x;
  if (child.y) element.y = child.y;
  element.relativeTransform = child.relativeTransform;
  element.resize(child.width, child.height);

  return element;
}

export async function generateChildNode(page: PageNode, child: any) {
  let element;
  switch (child.type) {
    case 'RECTANGLE':
      element = await generateRectancle(child);
      page.appendChild(element);
      break;
    case 'TEXT':
      element = await generateTextNode(child);
      page.appendChild(element);
      break;
    case 'FRAME':
      element = await generateParentNode(page, child);

      break;
    case 'GROUP':
      element = await generateParentNode(page, child);
      break;
  }
  return element;
}
