import axios from 'axios';

import { NodeParseContext } from '../../2-serialize-preview';
import { CNode, isCElementNode, isCPseudoElementNode } from '../../sb-serialize.model';

const urlRegex = /url\((.*?)\)/;
const protocolRegex = /(\w+):(.*)/;
const dataUrlRegex = /data:(\w+\/[-+.\w]+)(;base64)?,(.*)/;

const mimeSVG = 'image/svg+xml';

export async function processImage(node: CNode, { baseUrl }: NodeParseContext) {
  if (isCElementNode(node) || isCPseudoElementNode(node)) {
    const src = isCElementNode(node) && node.name === 'img' ? node.src : undefined;

    const { backgroundImage } = node.styles;
    const hasBackgroundImage = backgroundImage !== 'none' && backgroundImage && typeof backgroundImage === 'string';

    if (!hasBackgroundImage && !src) {
      return;
    }

    let urlValue: string | undefined = undefined;
    if (backgroundImage) {
      const match = backgroundImage.match(urlRegex);
      urlValue = parsedStringOrRaw(match?.[1]);
    } else {
      // img src
      urlValue = src;
    }

    if (!urlValue) {
      console.warn('Unsupported backgroundImage:', backgroundImage);
      return;
    }

    const match2 = urlValue.match(protocolRegex);
    let url: string | undefined = undefined;
    let mime: string | undefined = undefined;
    let buffer: Buffer | undefined = undefined;
    let contentStr: string | undefined = undefined;
    if (!match2 || match2[1] !== 'data') {
      // If no match, assumed to be a relative path.
      url = !match2 ? `${baseUrl}/${urlValue}` : urlValue;

      // Process the URL, fetch data and MIME type, fill `mime` and `content`.
      const resp = await axios.get(url, {
        responseType: 'arraybuffer',
      });
      mime = resp.headers['content-type'];
      buffer = Buffer.from(resp.data, 'binary');
    } else {
      // The data and mime are already available in the data url.
      const match3 = urlValue.match(dataUrlRegex);
      if (!match3) {
        console.warn('Invalid data URL, cannot process it:', urlValue);
        return;
      }
      // Case of data url
      mime = match3[1];
      const isBase64 = !!match3[2];
      if (isBase64) {
        buffer = Buffer.from(match3[3], 'base64');
      } else {
        contentStr = decodeURIComponent(match3[3]);
      }
    }

    if (mime === mimeSVG) {
      if (!contentStr) {
        console.warn('MIME is SVG, but no content extracted:', backgroundImage);
        return;
      }
      node.svg = contentStr;
    } else {
      if (!buffer) {
        console.warn('MIME should have binary content, but no buffer extracted:', backgroundImage);
        return;
      }
      // Default to an image we assume Figma will support. To review later if we have issues and/or a list of supported formats on Figma side.
      node.image = buffer.toJSON();
    }
  }
}

function parsedStringOrRaw(str: string | undefined): string | undefined {
  if (!str) return str;
  try {
    return JSON.parse(str);
  } catch (error) {
    return str;
  }
}
