import { NextFn } from '../../../common/app-models';
import { getFigmaSelection } from '../../common/selection-utils';

export function selectionPreview(next: NextFn<string | undefined>) {
  const sendSelectionPreview = async () => next(await generatePreview());
  figma.on('selectionchange', sendSelectionPreview);
  // Initial emit, for dev, when the figma plugin is open after the webapp.
  sendSelectionPreview();
}

export async function generatePreview() {
  const selections = getFigmaSelection();
  if (!selections || selections.length !== 1 /* || !selections[1] */) {
    return undefined;
  }
  const selection = selections[0];
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
  }
}
