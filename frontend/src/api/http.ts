import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { localizeServerMessage, useLocaleStore } from '@/i18n';
import type { ApiError, AuthResponse } from '@/types';
import { clearAuthSession, getAccessToken, getRefreshToken, saveAuthSession } from '@/utils/tokenStorage';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const SESSION_EXPIRED_EVENT = 'olympus:session-expired';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const http = axios.create({ baseURL });

let refreshPromise: Promise<string | null> | null = null;

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Accept-Language'] = useLocaleStore.getState().locale;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const isAuthCall = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;
      const token = await refreshSession();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return http(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

async function refreshSession() {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    expireSession();
    return null;
  }

  refreshPromise = axios
    .post<AuthResponse>(`${baseURL}/auth/refresh`, null, { params: { refreshToken } })
    .then((response) => {
      saveAuthSession(response.data);
      return response.data.accessToken;
    })
    .catch(() => {
      expireSession();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function expireSession() {
  clearAuthSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

/** Human-readable message for any failed request, in the current UI language. */
export function errorMessage(error: unknown, fallbackKey = 'errors.generic') {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.response?.status === 403 && !error.response.data?.message) {
      return localizeServerMessage(undefined, 'errors.forbidden');
    }
    return localizeServerMessage(error.response?.data?.message, fallbackKey);
  }
  return localizeServerMessage(undefined, fallbackKey);
}
