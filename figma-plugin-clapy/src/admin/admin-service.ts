import { fetchPluginNoResponse } from '../common/plugin-utils.js';
import { handleError, toastError } from '../front-utils/front-utils.js';
import { apiGet } from '../front-utils/http.utils.js';

// call le back du plugin pour générer des frame depuis les deux configs récupérer
export function renderFigmaConfig() {
  (async () => {
    try {
      const { data } = await apiGet('admin/get-config');
      fetchPluginNoResponse('generateConfig', data);
    } catch (e) {
      handleError(e);
      toastError(e);
    }
  })();
}
