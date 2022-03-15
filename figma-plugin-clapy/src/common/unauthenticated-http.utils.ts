import { useCallback, useEffect, useState } from 'react';

import { env } from '../environment/env';
import { mkUrl } from '../feat/auth/auth-service.utils';
import { wait } from './general-utils';
import { Dict } from './sb-serialize.model';

export interface ApiRequestConfig extends RequestInit {
  query?: Dict<string>;
  noRetry?: boolean;
}

export interface ApiResponse<T>
  extends Omit<Response, 'json' | 'clone' | 'arrayBuffer' | 'blob' | 'formData' | 'body' | 'text'> {
  data: T;
}

interface UseApiGetResponse<T> {
  loading: boolean;
  error?: any;
  data?: T;
  refetch: () => Promise<UseApiGetResponse<T>>;
}

export function useApiGet<T>(url: string, config?: ApiRequestConfig) {
  const refetch = useCallback(
    () =>
      apiGetUnauthenticated<T>(url, config)
        .then(({ data }) => {
          const newState: UseApiGetResponse<T> = { loading: false, error: undefined, data, refetch };
          setState(newState);
          return newState;
        })
        .catch(error => {
          const newState: UseApiGetResponse<T> = { loading: false, error, data: undefined, refetch };
          setState(newState);
          return newState;
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [loadingErrorData, setState] = useState<UseApiGetResponse<T>>({
    loading: true,
    error: undefined,
    data: undefined,
    refetch,
  });
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return loadingErrorData;
}

interface UsePostOptions<T> {
  config?: ApiRequestConfig;
  mapData?: (response: ApiResponse<T>) => ApiResponse<T> | void;
}

export function useApiPost<T>(url: string, body?: any, options?: UsePostOptions<T>) {
  const { config, mapData } = options || {};
  const [{ loading, error, data }, setState] = useState<{
    loading: boolean;
    error?: any;
    data?: T;
  }>({ loading: true, error: undefined, data: undefined });
  useEffect(() => {
    apiPostUnauthenticated<T>(url, body, config)
      .then(resp => {
        const resp2 = mapData?.(resp);
        return resp2 || resp;
      })
      .then(({ data }) => setState({ loading: false, error: undefined, data }))
      .catch(error => setState({ loading: false, error, data: undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { loading, error, data };
}

/**
 * Sends a GET request to the app API (REST classic method).
 * @param url API URL
 * @param config eventual Axios config, e.g. to add custom HTTP headers
 */
export async function apiGetUnauthenticated<T>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
  return httpGetUnauthenticated(apiFullUrl(url), config);
}

/**
 * Sends a POST request to the app API.
 * @param url API URL
 * @param body body to include in the POST request
 * @param config eventual Axios config, e.g. to add custom HTTP headers
 */
export async function apiPostUnauthenticated<T>(
  url: string,
  body?: any,
  config?: ApiRequestConfig,
): Promise<ApiResponse<T>> {
  return httpPostUnauthenticated(apiFullUrl(url), body, config);
}

export async function apiPostFile<T>(
  url: string,
  body?: Dict<string | Blob>,
  config?: ApiRequestConfig,
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  if (body) {
    for (const [key, value] of Object.entries(body)) {
      formData.append(key, value);
    }
  }
  return apiPostUnauthenticated(url, formData, {
    ...(config || {}),
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function httpGetUnauthenticated<T>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
  return httpReqUnauthenticated(url, config, (url, config) => fetch(url, config));
}

export async function httpPostUnauthenticated<T>(
  url: string,
  body?: any,
  config?: ApiRequestConfig,
): Promise<ApiResponse<T>> {
  return httpReqUnauthenticated(url, config, (url, config) =>
    fetch(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}

async function httpReqUnauthenticated<T>(
  url: string,
  config: ApiRequestConfig | undefined,
  sendRequest: (url: string, config: RequestInit) => Promise<Response>,
): Promise<ApiResponse<T>> {
  const { noRetry, query, ...fetchConfig } = config || {};
  url = mkUrl(url, query);
  let resp: ApiResponse<T> | undefined;
  try {
    resp = await unwrapFetchResp(sendRequest(url, extendConfig(fetchConfig)));
  } catch (e) {
    const err: Error = e as any;
    if (err.message === 'Failed to fetch') {
      // Network error. Let's make a fake response to trigger a retry below.
      resp = { ok: false, status: 0 } as ApiResponse<T>;
    } else {
      throw e;
    }
  }
  if (!resp) {
    console.error(
      `request to ${url} returned undefined. If this is a test, maybe a missing mock?` +
        ' Ensure a mock is properly defined at the beginning of this test, e.g.' +
        ' `mockApiGet(() => ({}));`',
    );
    throw new Error('Missing mock error');
  }
  if (!resp.ok) {
    // Ideally, test what other types of errors look like to retry them
    if (resp.status >= 500 || !resp.status) {
      await wait(1000);
      // tslint:disable-next-line:no-console
      console.info('Retrying HTTP request...');
      resp = await unwrapFetchResp(sendRequest(url, extendConfig(fetchConfig)));
    }
  }
  if (!resp.ok) {
    throw Object.assign(new Error('[http utils] Failed request'), resp);
  }
  return resp;
}

async function unwrapFetchResp<T>(respPromise: Promise<Response>): Promise<ApiResponse<T>> {
  const respRaw = await respPromise;
  const data: T = await respRaw.json();
  const { bodyUsed, headers, ok, redirected, status, statusText, type, url } = respRaw;
  return {
    bodyUsed,
    headers,
    ok,
    redirected,
    status,
    statusText,
    type,
    url,
    data,
  };
}

const requiredHeaders = {
  // CSRF protection if the server requires this token
  'X-Requested-By': env.securityRequestedByHeader,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
export const defaultOptions = { headers: requiredHeaders }; // Useful for tests

function extendConfig(config: RequestInit | undefined): RequestInit {
  const { headers, ...otherConf } = config || ({} as RequestInit);
  return {
    ...otherConf,
    ...(env.allowCorsApi && { credentials: 'include' }),
    headers: {
      ...headers,
      ...requiredHeaders,
    },
  };
}

function apiFullUrl(path: string) {
  if (path.startsWith('http')) {
    throw new Error(
      `Absolute URL provided instead of a path in the API. Are you trying to call an external service with the full URL? Use httpGet/httpPost instead of apiGet/apiPost.`,
    );
  }
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${env.apiBaseUrl}${path}`;
}
