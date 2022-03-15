import type { Routes, Subscriptions } from './app-models';

export const isFigmaPlugin = window.location.origin === 'null';

type UnPromise<T> = T extends Promise<infer U> ? U : T;

// Usage: `fetchPlugin('createRectangles', count)`
// We could have set an alternative syntax (not implemented): `fetchPlugin('createRectangles')(count)`.
export async function fetchPlugin<T extends keyof Routes>(
  routeName: T,
  ...args: Parameters<Routes[T]>
): Promise<UnPromise<ReturnType<Routes[T]>>> {
  return new Promise<UnPromise<ReturnType<Routes[T]>>>((resolve, reject) => {
    // Add an abortable event listener to cancel the subscription once the response is received.
    const aborter = new AbortController();
    // Listen to responses from the server. We listen to all messages and filter by type.
    // Then, for a one-shot fetch, we cancel the subscription.
    window.addEventListener(
      'message',
      event => {
        if (!event.data.pluginMessage || event.data.__source === 'browser') return;
        const { type, payload, error } = event.data.pluginMessage;
        if (type === routeName) {
          if (error) {
            reject(error);
          } else {
            resolve(payload);
          }
          aborter.abort();
        }
      },
      { signal: aborter.signal },
    );
    parent.postMessage({ pluginMessage: { type: routeName, payload: args }, __source: 'browser' }, '*');
  });
}

// Skip the response part. Avoid it until you know a response would be painful, e.g. when closing the plugin (emitting a response causes a useless warning because the UI has been destroyed).
export function fetchPluginNoResponse<T extends keyof Routes>(routeName: T, ...args: Parameters<Routes[T]>): void {
  parent.postMessage({ pluginMessage: { type: routeName, payload: args, noResponse: true } }, '*');
}

type Disposer = () => void;
type EmittedValue<T extends keyof Subscriptions> = Parameters<Parameters<Subscriptions[T]>[0]>[0];

export function subscribePlugin<T extends keyof Subscriptions>(
  routeName: T,
  subscription: (error: any, value: EmittedValue<T>) => void,
): Disposer {
  // Add an abortable event listener to cancel the subscription once the response is received.
  const aborter = new AbortController();
  // Listen to responses from the server. We listen to all messages and filter by type.
  window.addEventListener(
    'message',
    event => {
      if (!event.data.pluginMessage) return;
      const { type, payload, error } = event.data.pluginMessage;
      if (type === routeName) {
        subscription(error, payload);
      }
    },
    { signal: aborter.signal },
  );

  return () => aborter.abort();
}
