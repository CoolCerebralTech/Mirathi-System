// FILE: src/api/client.ts

import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosInstance,
} from 'axios';
import { useAuthStore } from '../store/auth.store';
import { AuthResponseSchema, ErrorResponseSchema } from '../types';

// Define a custom type that extends Axios's request config
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CONFIGURATION AND SETUP
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
if (!VITE_API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL is not defined. Please check your .env file.',
  );
}

/** Centralized API endpoint paths for easy management. */
const ApiEndpoints = {
  REFRESH_TOKEN: '/auth/refresh',
};

// State for handling token refresh logic to prevent multiple refresh requests.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// HELPER FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * Processes the queue of failed requests after a token refresh.
 * @param error - An error if the refresh failed.
 * @param token - The new access token if the refresh was successful.
 */
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

/**
 * A type-safe utility to extract a user-friendly error message from an unknown error.
 * It prioritizes structured API errors defined by `ErrorResponseSchema`.
 * @param error - The error caught in a catch block.
 * @returns A user-friendly error message string.
 */
export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response) {
    const parsed = ErrorResponseSchema.safeParse(error.response.data);
    if (parsed.success) {
      return parsed.data.message;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN AXIOS INSTANCE
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const apiClient: AxiosInstance = axios.create({
  baseURL: VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR: Injects the access token into the Authorization header
 * for every outgoing request.
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
 * RESPONSE INTERCEPTOR: Handles API responses, with a focus on automatic
 * token refresh for 401 Unauthorized errors.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      return handle401Error(originalRequest, error);
    }

    if (import.meta.env.DEV) {
      handleGenericError(error);
    }

    return Promise.reject(error);
  },
);

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TOKEN REFRESH LOGIC
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * Handles the logic for a 401 Unauthorized error, including token refresh.
 * @param originalRequest - The original request that failed.
 * @param error - The original Axios error.
 */
async function handle401Error(originalRequest: CustomAxiosRequestConfig, error: AxiosError) {
  originalRequest._retry = true;
  const { refreshToken, logout, setTokens } = useAuthStore.getState();

  if (!refreshToken) {
    logout();
    return Promise.reject(error);
  }

  // If a refresh is already in progress, queue the original request.
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
    // Perform the token refresh request
    const { data } = await axios.post(
      `${VITE_API_BASE_URL}${ApiEndpoints.REFRESH_TOKEN}`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );

    // Validate the refresh response with Zod
    const parsed = AuthResponseSchema.parse(data);

    // Update tokens in the auth store
    setTokens(parsed);

    // Process the queue with the new access token
    processQueue(null, parsed.accessToken);

    // Retry the original request with the new token
    originalRequest.headers!.Authorization = `Bearer ${parsed.accessToken}`;
    return apiClient(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError as Error, null);
    logout();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

/**
 * Handles generic network/server errors for development logging.
 * @param error - The Axios error object.
 */
function handleGenericError(error: AxiosError) {
  if (error.response) {
    const { status } = error.response;
    if (status >= 500) {
      console.error('Server Error:', status, error.message);
    } else if (status === 403) {
      console.error('Forbidden:', status, 'Check permissions.');
    } else if (status === 404) {
      console.error('Not Found:', status, 'Endpoint may be incorrect.');
    }
  } else if (error.code === 'ECONNABORTED') {
    console.error('Request Timeout:', error.message);
  } else {
    console.error('Network Error:', 'Could not connect to the server.');
  }
}
