import type { NextFn, PreviewResp, ProjectSelection } from '../../../common/app-models';
import { isBlendMixin } from '../../common/node-type-utils';
import { getFigmaSelection, getFigmaSelections } from '../../common/selection-utils';
import { readPageConfig } from './3-read-figma-config.js';
import { customCssPluginKey } from './read-figma-config-utils.js';

export let sendSelectionPreview: (() => void) | undefined;

export function selectionPreview(next: NextFn<PreviewResp>) {
  sendSelectionPreview = async () => next(await generatePreview());
  figma.on('selectionchange', sendSelectionPreview);
  // Initial emit, for dev, when the figma plugin is open after the webapp.
  setTimeout(sendSelectionPreview);
}

async function generatePreview(): Promise<PreviewResp> {
  const selection = getFigmaSelection();
  const page = readPageConfig();
  if (!selection) {
    return { preview: undefined, page };
  }
  if (typeof selection === 'string') {
    return { preview: undefined, page, error: selection };
  }
  if (isBlendMixin(selection) && selection.isMask) {
    return { preview: false, page };
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
    return { preview, page };
  } catch (error) {
    // Preview impossible, ignore it.
    return { preview: false, page };
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
  if (typeof selection === 'string') {
    return undefined;
  }
  const customCss = selection.getPluginData(customCssPluginKey);
  return { id: selection.id, css: customCss };
}

export function getSelectionsNodeId() {
  const selections = getFigmaSelections();
  return selections.map(({ id, name }) => ({ id, name } as ProjectSelection));
}
