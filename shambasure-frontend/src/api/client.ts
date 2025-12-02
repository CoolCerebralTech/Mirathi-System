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

// Define custom request config interface
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipAuth?: boolean;
}

// Base URL should NOT include the '/api' prefix - it's handled by the backend
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
if (!VITE_API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL is not defined. Please check your .env file.',
  );
}

/**
 * Centralized API endpoint paths
 */
const ApiEndpoints = {
  REFRESH_TOKEN: '/api/v1/auth/refresh',
};

// State for handling token refresh logic to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

// ============================================================================
// TOKEN VALIDATION HELPER
// ============================================================================

/**
 * Validates the structure and basic format of JWT tokens
 * Production-ready validation without heavy parsing
 */
const validateTokenStructure = (token: string | null): boolean => {
  if (!token) return false;
  
  // Check if it's a string and has content
  if (typeof token !== 'string' || token.trim().length === 0) {
    return false;
  }
  
  // For JWT tokens, check if they have the correct format (3 parts separated by dots)
  if (token.includes('.')) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Check each part is non-empty
    if (parts.some(part => part.trim().length === 0)) {
      return false;
    }
    
    // Optionally check if middle part (payload) is valid base64
    try {
      atob(parts[1]);
    } catch {
      return false;
    }
  }
  
  // For opaque tokens (like your refresh token), ensure minimum length
  if (token.length < 10) {
    return false;
  }
  
  return true;
};

/**
 * Checks if an access token is expired (only for JWTs)
 */
const isAccessTokenExpired = (token: string | null): boolean => {
  if (!token || !token.includes('.')) return true;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // Add 30-second buffer to account for network latency
    return expiryTime - currentTime < 30000;
  } catch {
    return true;
  }
};

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
      
      // Handle common HTTP error codes with user-friendly messages
      switch (error.response.status) {
        case 401:
          return 'Your session has expired. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 422:
          return 'Please check your input and try again.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'An internal server error occurred. Please try again later.';
        case 502:
        case 503:
        case 504:
          return 'The service is temporarily unavailable. Please try again later.';
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
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR: Injects the access token and handles token pre-expiry
 */
apiClient.interceptors.request.use(
  async (config) => {
    const { accessToken, refreshToken } = useAuthStore.getState();
    
    // Skip auth for refresh token endpoint and login endpoints
    if (config.url?.includes('/auth/') && config.method === 'post') {
      delete config.headers.Authorization;
      return config;
    }
    
    // Check if we have an access token
    if (accessToken) {
      // Check if access token is expired or about to expire
      if (isAccessTokenExpired(accessToken) && refreshToken) {
        console.log('[Auth] Access token expired or about to expire, attempting proactive refresh');
        
        try {
          // Attempt proactive refresh before the request fails
          const response = await axios.post(
            `${VITE_API_BASE_URL}${ApiEndpoints.REFRESH_TOKEN}`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );
          
          const parsed = AuthResponseSchema.parse(response.data);
          useAuthStore.getState().setTokens(parsed);
          
          // Update the current request with the new token
          config.headers.Authorization = `Bearer ${parsed.accessToken}`;
          return config;
        } catch (refreshError) {
          console.warn('[Auth] Proactive refresh failed, continuing with current token', refreshError);
          // Continue with current token - regular interceptor will handle 401
        }
      }
      
      // Use current token
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * RESPONSE INTERCEPTOR: Handles automatic token refresh for 401 errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    
    // Don't retry requests that should skip auth
    if (originalRequest?._skipAuth) {
      return Promise.reject(error);
    }
    
    // Only handle 401s, ensure it's not a retry, and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== ApiEndpoints.REFRESH_TOKEN
    ) {
      return handle401Error(originalRequest);
    }
    
    // Handle network errors specifically
    if (error.code === 'ERR_NETWORK') {
      console.error('[Network] Connection lost or server unreachable');
      // You could trigger a global network error state here
    }
    
    return Promise.reject(error);
  },
);

// ============================================================================
// TOKEN REFRESH LOGIC (PRODUCTION READY)
// ============================================================================

async function handle401Error(originalRequest: CustomAxiosRequestConfig) {
  originalRequest._retry = true;
  const { refreshToken, logout, setTokens, accessToken } = useAuthStore.getState();
  
  // Debug logging for production troubleshooting
  console.log('[Auth] Handling 401 error', {
    hasRefreshToken: !!refreshToken,
    refreshTokenValid: validateTokenStructure(refreshToken),
    hasAccessToken: !!accessToken,
    accessTokenValid: validateTokenStructure(accessToken),
    url: originalRequest.url,
  });
  
  // Validate refresh token presence and structure
  if (!refreshToken || !validateTokenStructure(refreshToken)) {
    console.error('[Auth] Invalid or missing refresh token. Structure check failed.');
    
    // Clear any potentially corrupted tokens
    logout();
    
    return Promise.reject(new Error(
      'Your session has expired. Please log in again to continue.'
    ));
  }
  
  // If a refresh is already in progress, queue this request
  if (isRefreshing) {
    console.log('[Auth] Refresh already in progress, queueing request');
    
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((newToken) => {
        console.log('[Auth] Using queued token for retry');
        originalRequest.headers!.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      })
      .catch((err) => {
        console.error('[Auth] Queued request failed:', err);
        return Promise.reject(err);
      });
  }
  
  isRefreshing = true;
  
  try {
    console.log('[Auth] Access token expired. Attempting to refresh...');
    
    // Create a clean axios instance for the refresh request to avoid circular dependencies
    const refreshClient = axios.create({
      baseURL: VITE_API_BASE_URL,
      timeout: 15000, // 15 seconds for refresh
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Remove any existing Authorization header to avoid using expired token
    delete originalRequest.headers?.Authorization;
    
    // Perform the token refresh request
    const { data } = await refreshClient.post<unknown>(
      ApiEndpoints.REFRESH_TOKEN,
      { refreshToken },
      {
        // Ensure no authorization header is sent for refresh request
        headers: { Authorization: undefined },
      }
    );
    
    console.log('[Auth] Received refresh response');
    
    // Validate the response structure
    const parsed = AuthResponseSchema.parse(data);
    
    // Validate the new tokens
    if (!validateTokenStructure(parsed.accessToken)) {
      throw new Error('Invalid access token structure received from refresh endpoint');
    }
    
    if (!validateTokenStructure(parsed.refreshToken)) {
      throw new Error('Invalid refresh token structure received from refresh endpoint');
    }
    
    console.log('[Auth] Token validation passed, updating store');
    
    // Update tokens in the store
    setTokens({
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
    });
    
    // Process any queued requests with the new token
    processQueue(null, parsed.accessToken);
    
    console.log('[Auth] Token refresh successful. Retrying original request:', originalRequest.url);
    
    // Update the original request with the new token
    originalRequest.headers!.Authorization = `Bearer ${parsed.accessToken}`;
    delete originalRequest._retry; // Allow future retries if needed
    
    return apiClient(originalRequest);
    
  } catch (refreshError) {
    console.error('[Auth] Token refresh failed:', {
      error: refreshError,
      message: refreshError instanceof Error ? refreshError.message : 'Unknown error',
      url: originalRequest.url,
    });
    
    // Process queued requests with the error
    processQueue(refreshError as Error, null);
    
    // Logout the user since refresh failed
    logout();
    
    // Return a user-friendly error
    return Promise.reject(
      new Error('Your session has expired. Please log in again to continue.')
    );
  } finally {
    isRefreshing = false;
  }
}

// ============================================================================
// DEBUG UTILITIES (Remove in production if desired)
// ============================================================================

/**
 * Debug function to check current auth state and storage
 */
export const debugAuthState = (): void => {
  const state = useAuthStore.getState();
  console.group('[Auth Debug]');
  console.log('Store State:', {
    user: state.user?.email,
    hasAccessToken: !!state.accessToken,
    accessTokenValid: validateTokenStructure(state.accessToken),
    accessTokenExpired: isAccessTokenExpired(state.accessToken),
    hasRefreshToken: !!state.refreshToken,
    refreshTokenValid: validateTokenStructure(state.refreshToken),
    status: state.status,
    storageType: state.storageType,
  });
  
  try {
    console.log('Local Storage:', {
      auth: localStorage.getItem('shamba-sure-auth'),
      storageType: localStorage.getItem('shamba-sure-auth-storage-type'),
    });
    console.log('Session Storage:', {
      auth: sessionStorage.getItem('shamba-sure-auth'),
      storageType: sessionStorage.getItem('shamba-sure-auth-storage-type'),
    });
  } catch (e) {
    console.warn('Could not access storage:', e);
  }
  console.groupEnd();
};

/**
 * Clear all auth-related storage (useful for debugging)
 */
export const clearAuthStorage = (): void => {
  localStorage.removeItem('shamba-sure-auth');
  sessionStorage.removeItem('shamba-sure-auth');
  localStorage.removeItem('shamba-sure-auth-storage-type');
  sessionStorage.removeItem('shamba-sure-auth-storage-type');
  
  console.log('[Auth] All storage cleared');
};

// ============================================================================
// REQUEST WRAPPER WITH ENHANCED ERROR HANDLING
// ============================================================================

export interface ApiRequestOptions {
  skipAuth?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Enhanced request wrapper with retry logic and better error handling
 */
export const apiRequest = async <T>(
  request: () => Promise<T>,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { retryAttempts = 0 } = options;
  let attempts = 0;
  
  const execute = async (): Promise<T> => {
    attempts++;
    
    try {
      const response = await request();
      return response;
    } catch (error) {
      // Check if it's an AxiosError to access response property
      if (axios.isAxiosError(error)) {
        // Retry logic for network errors
        if (
          (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') &&
          attempts <= retryAttempts
        ) {
          console.log(`[API] Retry attempt ${attempts}/${retryAttempts} for network error`);
          // Exponential backoff: 1s, 2s, 4s...
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempts - 1) * 1000)
          );
          return execute();
        }
        
        // Don't retry auth errors or client errors
        if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }
        
        // For server errors, retry if configured
        if (error.response?.status && error.response.status >= 500 && attempts <= retryAttempts) {
          console.log(`[API] Retry attempt ${attempts}/${retryAttempts} for server error`);
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempts - 1) * 1000)
          );
          return execute();
        }
      }
      
      // If it's not an AxiosError or doesn't match retry conditions, rethrow
      throw error;
    }
  };
  
  return execute();
};

// Type augmentation for axios
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
    _skipAuth?: boolean;
  }
}