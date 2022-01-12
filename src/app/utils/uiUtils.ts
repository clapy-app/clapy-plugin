import { Routes } from '../../common/appModels';

// Usage: `fetchPlugin('createRectangles', count)`
// We could have set an alternative syntax (not implemented): `fetchPlugin('createRectangles')(count)`.
export function fetchPlugin<T extends keyof Routes>(routeName: T, ...args: Parameters<Routes[T]>): Promise<ReturnType<Routes[T]>> {
  return new Promise((resolve, reject) => {
    // Add an abortable event listener to cancel the subscription once the response is received.
    const controller = new AbortController();
    // Listen to responses from the server. We listen to all messages and filter by type.
    // Then, for a one-shot fetch, we cancel the subscription.
    window.addEventListener("message", event => {
      const { type, payload, error } = event.data.pluginMessage;
      if (type === routeName) {
        if (error) {
          reject(error);
        } else {
          resolve(payload);
        }
        controller.abort();
      }
    }, { signal: controller.signal });
    parent.postMessage({ pluginMessage: { type: routeName, payload: args } }, '*');
  });
}

// Skip the response part. Avoid it until you know a response would be painful, e.g. when closing the plugin (emitting a response causes a useless warning because the UI has been destroyed).
export function fetchPluginNoResponse<T extends keyof Routes>(routeName: T, ...args: Parameters<Routes[T]>): void {
  parent.postMessage({ pluginMessage: { type: routeName, payload: args, noResponse: true } }, '*');
}
