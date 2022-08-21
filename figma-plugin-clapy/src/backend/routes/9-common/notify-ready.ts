import { sendSelectionPreview } from '../1-export-code/1-selection-ops.js';

export function notifyReady() {
  sendSelectionPreview?.();
}
