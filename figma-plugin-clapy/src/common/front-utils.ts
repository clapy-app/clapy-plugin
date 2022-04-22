import { DependencyList, useCallback } from 'react';
import { handleError } from './error-utils';
import { isFigmaPlugin } from './plugin-utils';

/** Same as useCallback, but accepting async functions. @see useCallback */
export function useCallbackAsync<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T {
  return useCallback<T>(
    // @ts-ignore
    (...args: any[]) => {
      return callback(...args);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, ...deps],
  );
}

/** Same as useCallbackAsync, but with try/catch handleError wrapper included. @see useCallback */
export function useCallbackAsync2<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T {
  return useCallback<T>(
    // @ts-ignore
    async (...args: any[]) => {
      try {
        return await callback(...args);
      } catch (error) {
        handleError(error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, ...deps],
  );
}

export function openWindowStep1() {
  const openedWindow = isFigmaPlugin ? null : window.open(undefined, '_blank' /* , 'noopener' */);
  if (!isFigmaPlugin && !openedWindow) throw new Error('Cannot open a window. Something is wrong.');
  return openedWindow;
}

export function openWindowStep2(openedWindow: Window | null, url: string) {
  if (isFigmaPlugin) {
    window.open(url, '_blank');
  } else {
    openedWindow!.location.href = url;
  }
}
