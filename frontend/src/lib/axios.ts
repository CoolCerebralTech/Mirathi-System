// src/lib/axios.ts
// ============================================================================
// Centralized Axios Instance
// ============================================================================
// - Configures a base Axios instance for all API communications.
// - Sets the base URL from environment variables for flexibility.
// - Includes an interceptor to automatically attach the JWT access token
//   to the headers of all outgoing requests, simplifying API calls
//   from feature-specific code.
// - Provides a clear, single point for managing API error handling,
//   timeouts, and other global request configurations.
// ============================================================================

import axios from 'axios';
import { useAuthStore } from '../store/auth.store'; // We will create this in the next phase

// 1. Get the API base URL from environment variables.
//    This allows us to easily switch between development, staging, and production APIs.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'; // Default for local dev

// 2. Create the Axios instance with the base configuration.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Use an interceptor to dynamically add the Authorization header.
//    This runs before every single request is sent.
apiClient.interceptors.request.use(
  (config) => {
    // Retrieve the auth token from our global state (Zustand store).
    const token = useAuthStore.getState().accessToken;

    // If a token exists, add it to the Authorization header.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle any request errors (e.g., network issues).
    return Promise.reject(error);
  },
);

// Note: We can also add a response interceptor here later to handle
// automatic token refreshing using the `refreshToken`. This is a more
// advanced pattern we will implement after the basic flow is working.