// FILE: src/api/client.ts

import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosInstance,
} from 'axios';
import { useAuthStore } from '../store/auth.store';
import { AuthResponseSchema } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipAuth?: boolean;
}

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
if (!VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

// CRITICAL FIX: Removed '/v1' prefix here because it is already in VITE_API_BASE_URL
const ApiEndpoints = {
  REFRESH_TOKEN: '/auth/refresh',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
};

// ============================================================================
// TOKEN HELPERS
// ============================================================================

const validateTokenStructure = (token: string | null): boolean => {
  if (!token) return false;
  if (typeof token !== 'string' || token.trim().length === 0) return false;

  if (token.includes('.')) {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    if (parts.some((p) => p.trim().length === 0)) return false;
    try {
      atob(parts[1]);
    } catch {
      return false;
    }
  }
  return token.length >= 10;
};

// ============================================================================
// ERROR HELPER
// ============================================================================

export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.response?.data?.detail) return error.response.data.detail; // FastAPI/Python style, keeping just in case
    if (error.response?.statusText) return error.response.statusText;
    if (error.request && !error.response) return 'Network error. Please check your connection.';
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  
  return 'An unexpected error occurred';
};

// ============================================================================
// MAIN AXIOS INSTANCE
// ============================================================================

export const apiClient: AxiosInstance = axios.create({
  baseURL: VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

apiClient.interceptors.request.use(
  async (config) => {
    const { accessToken } = useAuthStore.getState();

    // --- SKIP AUTH for public endpoints ---
    // We check if the URL contains the endpoint string to handle potential query params
    if (
      config.url?.includes(ApiEndpoints.LOGIN) ||
      config.url?.includes(ApiEndpoints.REGISTER) ||
      config.url?.includes(ApiEndpoints.REFRESH_TOKEN)
    ) {
      if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    }

    // --- Attach token if available ---
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // PRODUCTION NOTE: 
    // We REMOVED the "Proactive Token Expiry Check" here.
    // Why? It causes race conditions when multiple API calls fire at once.
    // Instead, we let the 401 happen, and the Response Interceptor handles the 
    // queueing and refreshing safely.

    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Safety check: if request was explicitly marked to skip auth logic
    if (originalRequest?._skipAuth) return Promise.reject(error);

    // Identify if the error came FROM an auth endpoint
    const isAuthEndpoint = 
      originalRequest?.url?.includes(ApiEndpoints.LOGIN) ||
      originalRequest?.url?.includes(ApiEndpoints.REGISTER) ||
      originalRequest?.url?.includes(ApiEndpoints.REFRESH_TOKEN);

    // If login failed, don't try to refresh. Just fail.
    if (error.response?.status === 401 && isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Handle 401 on PROTECTED endpoints -> Trigger Refresh Flow
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      return handle401Error(originalRequest);
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// TOKEN REFRESH LOGIC (Queue-based to prevent race conditions)
// ============================================================================

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (r?: unknown) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
};

async function handle401Error(originalRequest: CustomAxiosRequestConfig) {
  originalRequest._retry = true;
  const { refreshToken, logout, setTokens } = useAuthStore.getState();

  // 1. Basic Validation
  if (!refreshToken || !validateTokenStructure(refreshToken)) {
    console.log('[Auth] No valid refresh token available. Logging out.');
    logout();
    return Promise.reject(new Error('Session expired'));
  }

  // 2. If already refreshing, queue this request
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((newToken) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      })
      .catch((err) => Promise.reject(err));
  }

  // 3. Start Refresh Process
  isRefreshing = true;

  try {
    // Create a fresh axios instance for the refresh call to avoid interceptor loops
    const refreshClient = axios.create({ 
      baseURL: VITE_API_BASE_URL, 
      timeout: 15000 
    });
    
    const { data } = await refreshClient.post(ApiEndpoints.REFRESH_TOKEN, { refreshToken });
    
    // Validate response shape
    const parsed = AuthResponseSchema.parse(data);

    // Update Store
    setTokens(parsed);

    // Process all queued requests with the new token
    processQueue(null, parsed.accessToken);

    // Retry the original request
    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${parsed.accessToken}`;
    }
    return apiClient(originalRequest);

  } catch (err) {
    // If refresh fails, kill the session
    console.error('[Auth] Refresh failed', err);
    processQueue(err as Error, null);
    logout();
    return Promise.reject(new Error('Session expired'));
  } finally {
    isRefreshing = false;
  }
}