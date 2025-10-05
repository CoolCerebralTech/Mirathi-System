// src/api/auth.ts
// ============================================================================
// Authentication API Service
// ============================================================================
// - Encapsulates all API calls related to authentication (login, register, etc.).
// - Provides a clean, abstracted interface for UI components to interact with.
// - Uses the centralized `apiClient` for making HTTP requests.
// - Integrates with the `useAuthStore` to update the global state upon
//   successful authentication.
// - Handles API errors gracefully, transforming them into a consistent format
//   that the UI can easily consume and display.
// ============================================================================

import { apiClient } from '../lib/axios';
import { useAuthStore } from '../store/auth.store';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types'; // We will create/refine this file next
 // We will create/refine this file next

/**
 * Handles user registration by sending a request to the `/auth/register` endpoint.
 * On success, it updates the global authentication state.
 *
 * @param data The user registration data (firstName, lastName, email, password).
 * @returns A promise that resolves with the authentication response data.
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    // On successful registration, immediately set the auth state.
    useAuthStore.getState().actions.setAuth(response.data);

    return response.data;
  } catch (error) {
    // We re-throw the error so the UI layer can handle it (e.g., show a toast notification).
    // In a real app, we would log this error to a monitoring service.
    console.error('Registration failed:', error);
    throw error;
  }
};

/**
 * Handles user login by sending a request to the `/auth/login` endpoint.
 * On success, it updates the global authentication state.
 *
 * @param data The user's login credentials (email, password).
 * @returns A promise that resolves with the authentication response data.
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);

    // On successful login, set the auth state.
    useAuthStore.getState().actions.setAuth(response.data);

    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

/**
 * Handles user logout. In a stateless JWT setup, this is purely a client-side action.
 * It clears the authentication state from the store and localStorage.
 */
export const logout = (): void => {
  useAuthStore.getState().actions.logout();
  // We can also add a call to an `/auth/logout` endpoint if the backend
  // needs to invalidate a refresh token, for example.
};


/**
 * Sends a request to the `/auth/forgot-password` endpoint.
 *
 * @param data The user's email address.
 */
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  try {
    await apiClient.post('/auth/forgot-password', data);
  } catch (error) {
    console.error('Forgot password request failed:', error);
    throw error;
  }
};

/**
 * Sends a request to the `/auth/reset-password` endpoint with the token.
 *
 * @param data The reset token and the new password.
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  try {
    await apiClient.post('/auth/reset-password', data);
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
};