import { getTokens, refreshTokens } from './auth-service';
import { apiGetUnauthenticated, apiPostUnauthenticated, ApiRequestConfig, ApiResponse } from './unauthenticated-http.utils';

export async function apiGet<T>(url: string,
  config?: ApiRequestConfig): Promise<ApiResponse<T>> {
  return withAuthRetry(async () => apiGetUnauthenticated(url, await addAuthHeader(config)));
}

export async function apiPost<T>(url: string, body?: any,
  config?: ApiRequestConfig): Promise<ApiResponse<T>> {
  return withAuthRetry(async () => apiPostUnauthenticated(url, body, await addAuthHeader(config)));
}

async function withAuthRetry<T>(sendRequest: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  let resp: ApiResponse<T> | undefined;
  try {
    resp = await sendRequest();
  } catch (e) {
    const err: any = e;
    if (err?.status !== 401) {
      throw err;
    }
    await refreshTokens();
    // tslint:disable-next-line:no-console
    console.info('Retrying HTTP request with refreshed token...');
    resp = await sendRequest();
  }
  return resp;
}

async function addAuthHeader(config: ApiRequestConfig | undefined): Promise<ApiRequestConfig> {
  const { headers, ...otherConf } = config || {} as ApiRequestConfig;
  const { accessToken, tokenType } = await getTokens();
  return {
    ...otherConf,
    headers: {
      ...headers,
      ...(!!accessToken && { Authorization: `${tokenType || 'Bearer'} ${accessToken}` })
    },
  };
}