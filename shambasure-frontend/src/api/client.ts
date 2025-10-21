// FILE: src/api/client.ts

import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosInstance,
} from 'axios';
import { useAuthStore } from '../store/auth.store';
import { AuthResponseSchema, ErrorResponseSchema } from '../types';

// ============================================================================
// CONFIGURATION AND SETUP
// ============================================================================

// THE FIX: The base URL should NOT include the '/api' prefix.
// The '/api' prefix is a global setting on the backend, and our individual
// endpoint paths should include it. This prevents the "double api" bug.
// Ensure your .env file has: VITE_API_BASE_URL=http://localhost:3000
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
if (!VITE_API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL is not defined. Please check your .env file.',
  );
}

/**
 * Centralized API endpoint paths.
 * THE FIX: All paths now correctly start with `/api/v1/` to match the backend's
 * global prefix and versioning scheme.
 */
const ApiEndpoints = {
  REFRESH_TOKEN: '/api/v1/auth/refresh',
};

// State for handling token refresh logic to prevent multiple refresh requests.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Prioritize structured API error messages
    if (error.response) {
      const parsed = ErrorResponseSchema.safeParse(error.response.data);
      if (parsed.success) {
        return parsed.data.message;
      }
    }
    // Fallback for network errors or timeouts
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (error.code === 'ERR_NETWORK') return 'Network error. Please check your connection.';
    return `Request failed: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

// ============================================================================
// MAIN AXIOS INSTANCE
// ============================================================================

export const apiClient: AxiosInstance = axios.create({
  baseURL: VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR: Injects the access token.
 */
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * RESPONSE INTERCEPTOR: Handles automatic token refresh for 401 errors.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only handle 401s, ensure it's not a retry, and not the refresh endpoint itself that failed.
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== ApiEndpoints.REFRESH_TOKEN
    ) {
      return handle401Error(originalRequest);
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// TOKEN REFRESH LOGIC
// ============================================================================

async function handle401Error(originalRequest: InternalAxiosRequestConfig & { _retry?: boolean }) {
  originalRequest._retry = true;
  const { refreshToken, logout, setTokens } = useAuthStore.getState();

  // If no refresh token, logout immediately.
  if (!refreshToken) {
    logout();
    return Promise.reject(new Error('No refresh token available.'));
  }

  // If a refresh is already in progress, queue subsequent failed requests.
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((token) => {
        originalRequest.headers!.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      })
      .catch((err) => Promise.reject(err));
  }

  isRefreshing = true;

  try {
    console.log('[Auth] Access token expired. Attempting to refresh...');

    // Perform the token refresh request using the base apiClient.
    const { data } = await apiClient.post<unknown>(
      ApiEndpoints.REFRESH_TOKEN,
      { refreshToken }, // Send the refreshToken in the body as expected by the backend
    );

    const parsed = AuthResponseSchema.parse(data);

    setTokens(parsed);
    processQueue(null, parsed.accessToken);

    console.log('[Auth] Token refresh successful. Retrying original request.');
    originalRequest.headers!.Authorization = `Bearer ${parsed.accessToken}`;
    return apiClient(originalRequest);

  } catch (refreshError) {
    console.error('[Auth] Token refresh failed. Logging out.', refreshError);
    processQueue(refreshError as Error, null);
    logout();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}
