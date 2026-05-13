import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import type { AuthResponse } from '@/types';
import { clearAuthSession, getAccessToken, getRefreshToken, saveAuthSession } from '@/utils/tokenStorage';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const http = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    if (error.response?.status === 403) {
      toast.error('Недостаточно прав для выполнения действия');
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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
    clearAuthSession();
    return null;
  }

  refreshPromise = axios
    .post<AuthResponse>(`${baseURL}/auth/refresh`, null, {
      params: { refreshToken },
    })
    .then((response) => {
      saveAuthSession(response.data);
      return response.data.accessToken;
    })
    .catch(() => {
      clearAuthSession();
      toast.error('Сессия истекла, выполните вход заново');
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
