import { NodeParseContext } from '../../2-serialize-preview';
import { checkIsFontIcon, unquoteAndTrimString } from '../../../../utils';
import { CNode, isCPseudoElementNode } from '../../sb-serialize.model';
import { fontIconUnicodeToSVG } from './load-font';

export function processSVG(node: CNode, context: NodeParseContext) {
  const { fontsMap } = context;
  if (isCPseudoElementNode(node) && node.isFontIcon) {
    const fontFamily = unquoteAndTrimString(node.styles.fontFamily as string);
    const content = unquoteAndTrimString(node.styles.content); // unquote not required, already done?

    // Sanity check. Should be already done in Puppeteer, but just in case of bug/regression.
    if (!checkIsFontIcon(content)) {
      console.error(
        'Cannot process icon font on pseudo element',
        node.name,
        '- content is not a unicode char:',
        content,
        '- font family:',
        fontFamily,
      );
      return;
    }
    const font = fontsMap[fontFamily];
    if (!font) {
      console.error('The node has a font which is not listed in the fontsMap.');
      console.error('Node:');
      try {
        console.error(JSON.stringify(node));
      } catch (error) {
        console.error('(recursive object, cannot stringify)');
        console.error(node);
      }
      console.error('fontsMap:');
      try {
        console.error(JSON.stringify(fontsMap));
      } catch (error) {
        console.error('(recursive object, cannot stringify)');
        console.error(fontsMap);
      }
      return;
    }
    node.svg = fontIconUnicodeToSVG(font, content);
  }
}
