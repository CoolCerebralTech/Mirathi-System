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
import type { RefreshTokenResponse } from '../types/auth.types'; // Assuming your Zod file is here

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipAuth?: boolean;
}

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
if (!VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined in environment variables.');
}

// Routes based on Gateway -> Service mapping provided
const ApiEndpoints = {
  LOGIN: '/accounts/auth/login',
  REGISTER: '/accounts/auth/register',
  REFRESH_TOKEN: '/accounts/auth/refresh',
};

// ============================================================================
// HELPER: Token Structure Validation
// ============================================================================

const validateTokenStructure = (token: string | null): boolean => {
  if (!token || typeof token !== 'string' || token.trim().length === 0) return false;
  // Basic JWT structure check (header.payload.signature)
  return token.split('.').length === 3;
};

// ============================================================================
// AXIOS INSTANCE
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
    const accessToken = getAccessToken();

    // Skip Auth header for public authentication endpoints
    if (
      config.url?.includes(ApiEndpoints.LOGIN) ||
      config.url?.includes(ApiEndpoints.REGISTER) ||
      config.url?.includes(ApiEndpoints.REFRESH_TOKEN)
    ) {
      // Ensure we don't accidentally send a stale token to auth endpoints
      if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    }

    // Attach Bearer token
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

    // 1. Skip if explicitly requested or request is missing
    if (!originalRequest || originalRequest._skipAuth) {
      return Promise.reject(error);
    }

    // 2. Identify if error comes from an Auth Endpoint
    const isAuthEndpoint = 
      originalRequest.url?.includes(ApiEndpoints.LOGIN) ||
      originalRequest.url?.includes(ApiEndpoints.REGISTER) ||
      originalRequest.url?.includes(ApiEndpoints.REFRESH_TOKEN);

    // 3. If Login/Refresh fails, do NOT retry. Fail immediately.
    if (error.response?.status === 401 && isAuthEndpoint) {
      return Promise.reject(error);
    }

    // 4. Handle 401 on PROTECTED endpoints -> Trigger Token Refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      return handleTokenRefresh(originalRequest);
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// REFRESH LOGIC (Queue-based)
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

async function handleTokenRefresh(originalRequest: CustomAxiosRequestConfig) {
  originalRequest._retry = true;
  
  const refreshToken = getRefreshToken();
  const { logout, setTokens } = useAuthStore.getState();

  // A. Validation
  if (!refreshToken || !validateTokenStructure(refreshToken)) {
    logout();
    return Promise.reject(new Error('Session expired: Invalid refresh token'));
  }

  // B. If already refreshing, queue this request
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

  // C. Perform Refresh
  isRefreshing = true;

  try {
    // Create a dedicated client for refresh to avoid interceptor loops
    const refreshClient = axios.create({ 
      baseURL: VITE_API_BASE_URL, 
      timeout: 15000 
    });
    
    // Payload must match RefreshTokenRequestDto
    const { data } = await refreshClient.post<RefreshTokenResponse>(
      ApiEndpoints.REFRESH_TOKEN, 
      { refreshToken }
    );
    
    // Strict Backend DTO: { accessToken, refreshToken, tokenMetadata, ... }
    const newAccessToken = data.accessToken;
    const newRefreshToken = data.refreshToken;

    if (!newAccessToken || !newRefreshToken) {
      throw new Error('Invalid token response from server');
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
    processQueue(err as Error, null);
    logout();
    return Promise.reject(new Error('Session expired: Refresh failed'));
  } finally {
    isRefreshing = false;
  }
}

// ============================================================================
// ERROR UTILS
// ============================================================================

export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    
    // Handle NestJS Class Validator array responses
    if (data?.message && Array.isArray(data.message)) {
      return data.message[0];
    }
    
    // Handle Standard NestJS error response
    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }
  
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
};