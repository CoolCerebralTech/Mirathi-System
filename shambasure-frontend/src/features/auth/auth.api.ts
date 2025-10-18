// FILE: src/features/auth/auth.api.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { userKeys } from '../user/user.api';
import {
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type AuthResponse,
  AuthResponseSchema,
  type SuccessResponse,
  SuccessResponseSchema,
} from '../../types';
import { toast } from 'sonner'

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API ENDPOINTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ApiEndpoints = {
  LOGIN: '/v1/auth/login',
  REGISTER: '/v1/auth/register',
  FORGOT_PASSWORD: '/v1/auth/forgot-password',
  RESET_PASSWORD: '/v1/auth/reset-password',
  // A future endpoint for server-side token invalidation could go here
  // LOGOUT: '/auth/logout',
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * Sends login credentials to the server.
 * @returns A promise resolving to the full AuthResponse.
 */
const loginUser = async (credentials: LoginInput): Promise<AuthResponse> => {
  const { data } = await apiClient.post(ApiEndpoints.LOGIN, credentials);
  return AuthResponseSchema.parse(data); // Runtime validation
};

/**
 * Sends registration data to the server.
 * @returns A promise resolving to the full AuthResponse.
 */
const registerUser = async (
  registrationData: RegisterInput,
): Promise<AuthResponse> => {
  const { data } = await apiClient.post(ApiEndpoints.REGISTER, registrationData);
  return AuthResponseSchema.parse(data);
};

/**
 * Sends a forgot password request for a given email.
 */
const forgotPassword = async (
  forgotPasswordData: ForgotPasswordInput,
): Promise<SuccessResponse> => {
  const { data } = await apiClient.post(
    ApiEndpoints.FORGOT_PASSWORD,
    forgotPasswordData,
  );
  return SuccessResponseSchema.parse(data);
};

/**
 * Sends a new password and reset token to the server.
 */
const resetPassword = async (
  resetPasswordData: ResetPasswordInput,
): Promise<SuccessResponse> => {
  const { data } = await apiClient.post(
    ApiEndpoints.RESET_PASSWORD,
    resetPasswordData,
  );
  return SuccessResponseSchema.parse(data);
};

/**
 * Simulates a logout. In a real app, this could call a server endpoint
 * to invalidate the refresh token. For now, it's a client-side operation.
 */
const logoutUser = async (): Promise<void> => {
  // Example: await apiClient.post(ApiEndpoints.LOGOUT);
  return Promise.resolve();
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

type AuthMutationPayload = {
  data: LoginInput | RegisterInput;
  rememberMe?: boolean;
};

/**
 * Hook for handling user login.
 */
export const useLogin = () => {
  const { login: loginAction } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: AuthMutationPayload) => loginUser(data as LoginInput),
    onSuccess: (authData, { rememberMe }) => {
      loginAction(authData, rememberMe);
      queryClient.setQueryData(userKeys.profile(), authData.user);
      toast.success('Logged in successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
      console.error('Login failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook for handling user registration.
 */
export const useRegister = () => {
  const { login: loginAction } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: AuthMutationPayload) =>
      registerUser(data as RegisterInput),
    onSuccess: (authData, { rememberMe }) => {
      loginAction(authData, rememberMe);
      queryClient.setQueryData(userKeys.profile(), authData.user);
      toast.success('Account created successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

/**
 * Hook for handling forgot password requests.
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast.success('Password reset link sent to your email');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

/**
 * Hook for handling password resets.
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success('Password reset successfully. You can now log in.');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error)); 
    },
  });
};

/**
 * Hook for handling user logout.
 * This action clears both the Zustand store and the React Query cache.
 */
export const useLogout = () => {
  const { logout: logoutAction } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      logoutAction();
      queryClient.clear(); // Clear all cached data on logout
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Ensure client-side logout happens even if the server call fails
      logoutAction();
      queryClient.clear();
      toast.error('Logout failed on server, but you have been logged out locally');
    },
  });
};