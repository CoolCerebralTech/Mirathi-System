// FILE: src/api/client.ts

import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosInstance,
  type AxiosResponse,
} from 'axios';
import { useAuthStore } from '../store/auth.store';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
if (!VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

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
  // ✅ CRITICAL: Ensures Cookies (HttpOnly) are sent to BOTH GraphQL and REST endpoints
  withCredentials: true, 
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    // Note: We do not attach Bearer tokens anymore.
    // The HttpOnly cookie handles auth for both GraphQL and REST.
    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 1. GraphQL Error Handling (200 OK with errors)
    if (response.data && response.data.errors && response.data.errors.length > 0) {
      const firstError = response.data.errors[0];
      
      if (firstError.extensions?.code === 'UNAUTHENTICATED' || firstError.message === 'Unauthorized') {
         handleSessionExpired();
         return Promise.reject(new Error('Session expired'));
      }
      return response;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // 2. REST Error Handling (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      handleSessionExpired();
      return Promise.reject(new Error('Session expired'));
    }

    // 3. Network Errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// SESSION MANAGEMENT HELPER
// ============================================================================

function handleSessionExpired() {
  // ✅ FIX: Access 'status' instead of 'isAuthenticated'
  const { logout, status } = useAuthStore.getState();
  
  if (status === 'authenticated') {
    console.warn('[Client] Session expired. Logging out...');
    logout();
    // Optional: window.location.href = '/login'; 
  }
}

// ============================================================================
// ERROR HELPER
// ============================================================================

export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // REST Error Format (NestJS default)
    if (error.response?.data?.message) {
      if (Array.isArray(error.response.data.message)) {
        return error.response.data.message[0];
      }
      return error.response.data.message;
    }
    // Standard error field
    if (error.response?.data?.error) return error.response.data.error;
    
    // GraphQL Error Format
    if (error.response?.data?.errors?.[0]?.message) {
      return error.response.data.errors[0].message;
    }
  }

  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};