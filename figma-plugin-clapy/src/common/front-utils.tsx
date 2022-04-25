import { DependencyList, useCallback } from 'react';
import { toast } from 'react-toastify';

import { ErrorAlert2, ErrorAlertButtons } from '../components-old/ErrorAlert/ErrorAlert';
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
    openedWindow = window.open(url, '_blank');
  } else {
    openedWindow!.location.href = url;
  }
  return openedWindow;
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

  let errorStr = error ? error?.stack || JSON.stringify(error, Object.getOwnPropertyNames(error)) : 'Unknown error';
  if (error?.nodeName) {
    errorStr = `${error.nodeName}\n${errorStr}`;
  }
  // Mail link generated with https://mailtolink.me/
  const emailLink =
    `mailto:support@clapy.co?subject=Reporting%20an%20error%20I%20faced%20using%20Clapy&body=Hi%20Clapy%20team%2C%0D%0A%0D%0AI%20faced%20the%20following%20error%20while%20using%20the%20Clapy.%0D%0A%0D%0AHere%20are%20the%20steps%20to%20reproduce%3A%0D%0A%0D%0A-%20XXX%0D%0A-%20XXX%0D%0A%0D%0AThe%20error%3A%0D%0A%0D%0A${encodeURIComponent(
      errorStr,
    )}`.substring(0, 1800);
  const errorMsgDisplayed = `Error: ${error?.message || errorStr}`;
  toast(<ErrorAlert2>{errorMsgDisplayed}</ErrorAlert2>, {
    closeButton: ({ closeToast }) => <ErrorAlertButtons closeToast={closeToast} emailLink={emailLink} />,
  });
}
