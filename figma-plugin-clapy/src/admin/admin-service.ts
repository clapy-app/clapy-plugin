import { useCallbackAsync2 } from '../front-utils/front-utils.js';
import { apiGet } from '../front-utils/http.utils.js';

export function useHandleFigmaConfigs() {
  return useCallbackAsync2(async () => {
    console.log(await apiGet('admin/get-config'));
  }, []);
}
