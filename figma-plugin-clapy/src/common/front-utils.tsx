import type { DependencyList } from 'react';
import { useCallback } from 'react';
import { toast } from 'react-toastify';

import { ErrorAlert2, ErrorAlertButtons } from '../components-used/ErrorAlert/ErrorAlert';
import { isFigmaPlugin } from '../environment/env';
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
        return await callback(...args);
      } catch (error) {
        handleError(error);
        toastError(error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, ...deps],
  );
}
/** @deprecated this is deprecated. use new method @see openNewTab */
export function openWindowStep1() {
  const openedWindow = isFigmaPlugin ? null : window.open(undefined, '_blank' /* , 'noopener' */);
  if (!isFigmaPlugin && !openedWindow) throw new Error('Cannot open a window. Something is wrong.');
  return openedWindow;
}
/** @deprecated this is deprecated. use new method @see openNewTab */
export function openWindowStep2(openedWindow: Window | null, url: string) {
  if (isFigmaPlugin) {
    openedWindow = window.open(url, '_blank');
  } else {
    openedWindow!.location.href = url;
  }
  return openedWindow;
}
export function openNewTab(url: string) {
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('target', '_blank');
  a.click();
}
export function toastError(error: any) {
  // Last unused piece from ErrorComp:
  // if (!error) return null;
  // if (error === 'Interrupted') {
  //   return (
  //     <div>
  //       <em>{error}</em>
  //     </div>
  //   );
  // }

  if (error?.message === 'cancelled') {
    return;
  }

  const { emailLink, errorMsgDisplayed } = parseErrorForDisplay(error);

  toast(<ErrorAlert2>{errorMsgDisplayed}</ErrorAlert2>, {
    closeButton: ({ closeToast }) => <ErrorAlertButtons closeToast={closeToast} emailLink={emailLink} />,
  });
}

export function parseErrorForDisplay(error: any) {
  const { data, headers, status, statusText, type, url } = error || {};
  let errorStr = data
    ? JSON.stringify({ data, headers, status, statusText, type, url })
    : error
    ? error?.stack || JSON.stringify(error, Object.getOwnPropertyNames(error))
    : 'Unknown error';
  if (error?.nodeName) {
    errorStr = `${error.nodeName}\n${errorStr}`;
  }
  // Mail link generated with https://mailtolink.me/
  const emailLink =
    `mailto:support@clapy.co?subject=%5BBug%5D%20Short%20description%20here%20XXX&body=Please%20describe%20the%20steps%20to%20reproduce%3A%0D%0A%0D%0A-%20XXX%0D%0A-%20XXX%0D%0A%0D%0A-------------------%0D%0A%0D%0A${encodeURIComponent(
      errorStr,
    )}`.substring(0, 1800);
  const errorMsgDisplayed = `Error: ${data ? JSON.stringify(data.error || data) : error?.message || errorStr}`;
  return { emailLink, errorMsgDisplayed };
}
