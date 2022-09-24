import { fetchPluginNoResponse } from '../common/plugin-utils.js';
import type { FigmaConfigGenPayload, GenerationHistory } from '../common/sb-serialize.model.js';
import { handleError, toastError } from '../front-utils/front-utils.js';
import { apiPost } from '../front-utils/http.utils.js';

// call le back du plugin pour générer des frame depuis les deux configs récupérer
export function renderFigmaConfig(figmaConfigGenPayload: FigmaConfigGenPayload) {
  (async () => {
    try {
      const { data } = await apiPost('admin/get-config', figmaConfigGenPayload); // next maj.
      fetchPluginNoResponse('generateConfig', data as GenerationHistory[]);
    } catch (e) {
      handleError(e);
      toastError(e);
    }
  })();
}
