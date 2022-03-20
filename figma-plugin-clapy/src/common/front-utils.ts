import { DependencyList, useCallback } from 'react';

import { handleError } from './error-utils';

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
        return callback(...args);
      } catch (error) {
        handleError(error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, ...deps],
  );
}
