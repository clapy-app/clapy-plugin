import { NextMessage, RequestMessage, ResponseMessage, ResponseMessageError, Routes, Subscriptions } from '../../common/app-models';

export function initRoutes(routes: Routes) {
  figma.ui.onmessage = async ({ type, payload, noResponse }: RequestMessage, props) => {
    const handler = routes[type] as (...args: any) => any;
    if (!handler) throw new Error(`Unknown message type for message: ${JSON.stringify({ type, payload })}`);

    try {
      const response = await handler(...payload, props);
      if (!noResponse) {
        const responseMessage: ResponseMessage = {
          type,
          payload: response,
        };
        figma.ui.postMessage(responseMessage);
      }
    } catch (error: any) {
      if (!noResponse) {
        const responseError: ResponseMessageError = {
          type,
          error: error || new Error(`[Custom] Unknown error when running controller code on route ${type}.`),
        };
        figma.ui.postMessage(responseError);
        console.error('type:', type);
        const e: Error = error || new Error(`[Custom] Unknown error when running controller code on route ${type}.`);
        console.error(e.message);
        console.error(e.stack);
      } else {
        console.error(error || `[Custom] Unknown error when running controller code on route ${type}.`);
      }
    }
  };
}

export function initSubscriptions(subscriptions: Subscriptions) {
  for (const [name, subscription] of Object.entries(subscriptions)) {
    subscription(value => {
      const msg: NextMessage = { type: name as keyof Subscriptions, payload: value };
      figma.ui.postMessage(msg);
    });
  }
}
