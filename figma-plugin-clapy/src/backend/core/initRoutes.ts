import type {
  NextMessage,
  RequestMessage,
  ResponseMessage,
  ResponseMessageError,
  Routes,
  Subscriptions,
} from '../../common/app-models';
import { env } from '../../environment/env';

export function initRoutes(routes: Routes) {
  figma.ui.onmessage = async ({ __id, type, payload, noResponse }: RequestMessage, props) => {
    const handler = routes[type] as (...args: any) => any;
    if (!handler) throw new Error(`Unknown message type for message: ${JSON.stringify({ type, payload })}`);

    try {
      if (env.isDev) {
        console.log('Calling route', type);
      }
      const response = await handler(...payload, props);
      if (!noResponse) {
        const responseMessage: ResponseMessage = {
          __id,
          type,
          payload: response,
        };
        figma.ui.postMessage(responseMessage);
      }
      if (env.isDev) {
        console.log('Completed route', type);
      }
    } catch (error: any) {
      error = error || new Error(`[Custom] Unknown error when running controller code on route ${type}.`);
      if (!noResponse) {
        const responseError: ResponseMessageError = {
          __id,
          type,
          error: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))),
        };
        figma.ui.postMessage(responseError);
      }
      console.error('plugin route:', type, '__id:', __id);
      console.error(error);
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
