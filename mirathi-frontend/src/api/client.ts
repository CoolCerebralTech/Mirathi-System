// FILE: src/api/client.ts

import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosInstance,
} from 'axios';
import { 
  getAccessToken, 
  getRefreshToken, 
  useAuthStore 
} from '../store/auth.store'; 

interface GenericAuthResponse {
  // Shape A: Flat tokens (sometimes used in refresh endpoints)
  accessToken?: string;
  refreshToken?: string;
  
  // Shape B: Nested tokens (used in login/register endpoints)
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  
  // Allow other properties (user, metadata, etc.)
  [key: string]: unknown; 
}

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

// ✅ CRITICAL UPDATE: 
// The Gateway Base URL is: http://localhost:3000/api
// The Gateway maps: /accounts -> Accounts Service
// The Accounts Service has: /auth/login
// Therefore, the path here must be: /accounts/auth/login
const ApiEndpoints = {
  LOGIN: '/accounts/auth/login',
  REGISTER: '/accounts/auth/register',
  REFRESH_TOKEN: '/accounts/auth/refresh',
};

// ============================================================================
// TOKEN HELPERS
// ============================================================================

const validateTokenStructure = (token: string | null): boolean => {
  if (!token) return false;
  if (typeof token !== 'string' || token.trim().length === 0) return false;

  // Basic JWT structure check (header.payload.signature)
  if (token.includes('.')) {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
  }
  return true;
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
    // ✅ Use the helper function to get token from either LocalStorage OR Session
    const accessToken = getAccessToken();

    // --- SKIP AUTH for public endpoints ---
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

    if (originalRequest?._skipAuth) return Promise.reject(error);

    // Identify if the error came FROM an auth endpoint
    const isAuthEndpoint = 
      originalRequest?.url?.includes(ApiEndpoints.LOGIN) ||
      originalRequest?.url?.includes(ApiEndpoints.REGISTER) ||
      originalRequest?.url?.includes(ApiEndpoints.REFRESH_TOKEN);

    // If login/register/refresh failed, do not retry.
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
// TOKEN REFRESH LOGIC
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
  
  const refreshToken = getRefreshToken();
  const { logout, setTokens } = useAuthStore.getState();

  // 1. Basic Validation
  if (!refreshToken || !validateTokenStructure(refreshToken)) {
    console.warn('[Auth] No valid refresh token available. Logging out.');
    logout();
    return Promise.reject(new Error('Session expired'));
  }

  // 2. Queueing logic
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
    const refreshClient = axios.create({ 
      baseURL: VITE_API_BASE_URL, 
      timeout: 15000 
    });
    
    // Call: http://localhost:3000/api/accounts/auth/refresh
    const { data } = await refreshClient.post(ApiEndpoints.REFRESH_TOKEN, { refreshToken });
    
    // ✅ FIX: Use the typed interface instead of 'any'
    const responseData = data as GenericAuthResponse;

    // Safely extract tokens from either structure
    const newAccessToken = responseData.tokens?.accessToken || responseData.accessToken;
    const newRefreshToken = responseData.tokens?.refreshToken || responseData.refreshToken;

    if (!newAccessToken || !newRefreshToken) {
      throw new Error('Invalid token response structure');
    }

    // Update Store
    setTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    });

    // Process queue
    processQueue(null, newAccessToken);

    // Retry original request
    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    }
    return apiClient(originalRequest);

  } catch (err) {
    console.error('[Auth] Refresh failed', err);
    processQueue(err as Error, null);
    logout();
    return Promise.reject(new Error('Session expired'));
  } finally {
    isRefreshing = false;
  }
}

// ============================================================================
// ERROR HELPER (Exported for UI components)
// ============================================================================
export const extractErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        // Handle array of messages (Class Validator)
        if (Array.isArray(error.response.data.message)) {
            return error.response.data.message[0];
        }
        return error.response.data.message;
      }
      if (error.response?.data?.error) return error.response.data.error;
    }
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred';
  };