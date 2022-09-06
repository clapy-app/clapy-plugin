import filetype from 'magic-bytes.js';

import type { ExportImageEntry } from '../../../common/sb-serialize.model.js';

export async function extractImage(imageHashToExtract: string) {
  const image = figma.getImageByHash(imageHashToExtract);
  if (!image) {
    console.warn(
      'BUG Image hash available in fill, but image not found in global figma.getImageByHash:',
      imageHashToExtract,
    );
  } else {
    // If I need the hidden URL later:
    // https://www.figma.com/file/${figma.fileKey}/image/${imageHashToExtract}
    const uint8Array = await image.getBytesAsync();
    const imageObj: ExportImageEntry = {
      bytes: Array.from(uint8Array),
    };
    // E.g. [{ extension: "png", mime: "image/png", typename: "png" }]
    const fileType = filetype(uint8Array);
    if (!image || !fileType[0]) {
      console.warn('BUG Image file type is not recognized by the file-type library. Image hash:', imageHashToExtract);
    } else {
      Object.assign(imageObj, fileType[0]);
    }
    return imageObj;
  }
}
