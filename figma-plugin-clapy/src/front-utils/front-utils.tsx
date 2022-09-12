import type { DependencyList } from 'react';
import { useReducer, useCallback } from 'react';
import { toast } from 'react-toastify';
import { signInCancelledCode } from '../common/error-utils.js';

import { Alert, ErrorAlertButtons } from '../components-used/ErrorAlert/ErrorAlert';
import { env } from '../environment/env.js';
import { apiPost } from './http.utils.js';

// TODO search all usages of handleErrorBack in the front, and replace with handleError
export function handleError(error: any) {
  if (error?.message === signInCancelledCode) {
    return;
  }
  console.error('[handleError]', error);

  if (!env.isDev) {
    // Send the error to the webservice for monitoring.
    let { message, stack } = error;
    const errorStr = JSON.stringify(error);
    const original = JSON.parse(errorStr);
    if (!message) message = errorStr;
    if (!stack) stack = new Error(message).stack;
    const serialized = { message, stack, original };
    apiPost('front-monitor', serialized, { noRetry: true, silentErrors: true }).catch(/* silent errors */);
  }
}

// dependencies are linted with the rule in .eslintrc.js, to complete with custom hooks that have dependencies.
/** Same as useCallback, but accepting async functions. @see useCallback */
export function useCallbackAsync<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T {
  return useCallback<T>(
    // @ts-ignore
    async (...args: any[]) => {
      return await callback(...args);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps],
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
    [...deps],
  );
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

  if (error?.message === signInCancelledCode) {
    return;
  }

  const { emailLink, errorMsgDisplayed } = parseErrorForDisplay(error);

  toast(<Alert>{errorMsgDisplayed}</Alert>, {
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

function incr(x: number) {
  return x + 1;
}

// https://reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate
export function useForceUpdate() {
  return useReducer(incr, 0)[1];
}
