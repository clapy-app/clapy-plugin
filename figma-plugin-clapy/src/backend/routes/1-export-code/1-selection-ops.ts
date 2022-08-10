import type { NextFn } from '../../../common/app-models';
import { isBlendMixin } from '../../common/node-type-utils';
import { getFigmaSelection } from '../../common/selection-utils';
import { customCssPluginKey } from './read-figma-config-utils.js';

let sendSelectionPreview: (() => void) | undefined;

export async function getSelectionPreview() {
  sendSelectionPreview?.();
}

export function selectionPreview(next: NextFn<string | undefined | false>) {
  sendSelectionPreview = async () => next(await generatePreview());
  figma.on('selectionchange', sendSelectionPreview);
  // Initial emit, for dev, when the figma plugin is open after the webapp.
  setTimeout(sendSelectionPreview);
}

async function generatePreview() {
  const selection = getFigmaSelection();
  if (!selection) {
    return undefined;
  }
  if (isBlendMixin(selection) && selection.isMask) {
    return false;
  }
  try {
    const preview = figma.base64Encode(
      await selection.exportAsync({
        format: 'JPG',
        constraint: {
          type: 'HEIGHT',
          value: 180,
        },
      }),
    );
    return preview;
  } catch (error) {
    // Preview impossible, ignore it.
    return false;
  }
}

export async function saveCustomCssInFigmaNode(code: string, nodeId: string | undefined) {
  const editedNode = nodeId ? figma.getNodeById(nodeId) : undefined;
  // const selection = getFigmaSelectionOrThrow();
  editedNode?.setPluginData(customCssPluginKey, code || '');
}

let sendSelectionCustomCss: (() => void) | undefined;

export async function getSelectionCustomCss() {
  sendSelectionCustomCss?.();
}

export function selectionCustomCss(next: NextFn<{ id: string; css: string } | undefined>) {
  sendSelectionCustomCss = async () => next(await readCustomCssFromNode());
  figma.on('selectionchange', sendSelectionCustomCss);
  // Initial emit, for dev, when the figma plugin is open after the webapp.
  setTimeout(sendSelectionCustomCss);
}

async function readCustomCssFromNode() {
  const selection = getFigmaSelection();
  if (!selection) {
    return undefined;
  }
  const customCss = selection.getPluginData(customCssPluginKey);
  return { id: selection.id, css: customCss };
}
