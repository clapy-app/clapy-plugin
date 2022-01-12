import { Routes } from '../../common/appModels';

export function initRoutes(routes: Routes) {
  type Msg<T = any> = { type: keyof typeof routes, payload: T[], noResponse?: boolean; };

  figma.ui.onmessage = async ({ type, payload, noResponse }: Msg, props) => {
    const handler = routes[type] as (...args: any) => any;
    if (!handler) throw new Error(`Unknown message type for message: ${JSON.stringify({ type, payload })}`);

    try {
      const response = await handler(...payload, props);
      if (!noResponse) {
        figma.ui.postMessage({
          type,
          payload: response,
        });
      }
    } catch (error) {
      if (!noResponse) {
        figma.ui.postMessage({
          type,
          error: error || new Error(`[Custom] Unknown error when running controller code on route ${type}.`),
        });
      } else {
        console.error(error || `[Custom] Unknown error when running controller code on route ${type}.`);
      }
    }
  };
}