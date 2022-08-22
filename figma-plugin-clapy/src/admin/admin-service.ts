import { handleError, toastError } from '../front-utils/front-utils.js';
import { apiGet } from '../front-utils/http.utils.js';

// call le back du plugin pour génér<er des frame depuis les deux configs récupérer
export function renderFigmaConfig() {
  (async () => {
    try {
      console.log(await apiGet('admin/get-config'));
    } catch (e) {
      handleError(e);
      toastError(e);
    }
  })();
}
