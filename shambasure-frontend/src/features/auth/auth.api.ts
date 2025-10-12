// FILE: src/features/auth/auth.api.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthActions } from '../../store/auth.store';
import { userKeys } from '../user/user.api';
import  type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AuthResponse,
} from '../../types';

// ============================================================================
// API FUNCTIONS
// ============================================================================

const loginUser = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

const registerUser = async (data: RegisterInput): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

const forgotPassword = async (data: ForgotPasswordInput): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/forgot-password', data);
  return response.data;
};

const resetPassword = async (data: ResetPasswordInput): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/reset-password', data);
  return response.data;
};

// ARCHITECTURAL UPGRADE: The backend does not have a /auth/logout endpoint.
// A true logout is a client-side state-clearing operation.
// We remove the failing API call but keep the mutation hook structure.
const logoutUser = async (): Promise<void> => {
  // In the future, if a POST /auth/logout endpoint is added to invalidate
  // the refresh token on the server, the call will go here.
  // For now, it resolves immediately.
  return Promise.resolve();
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useLogin = () => {
  const { login: loginAction } = useAuthActions();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      loginAction(data);
      // SIMPLIFICATION: Use the single, authoritative query key from user.api.ts
      queryClient.setQueryData(userKeys.profile(), data.user);
    },
    // The onError is better handled in the component (e.g., to show a toast)
    // than with a console.error here.
  });
};

export const useRegister = () => {
  const { login: loginAction } = useAuthActions();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      loginAction(data);
      queryClient.setQueryData(userKeys.profile(), data.user);
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPassword,
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPassword,
  });
};

// ARCHITECTURAL UPGRADE: useRefreshToken hook is removed. The apiClient interceptor handles this automatically.

export const useLogout = () => {
  const { logout: logoutAction } = useAuthActions();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      logoutAction();
      queryClient.clear();
    },
    // Add an onError to ensure logout happens even if the (future) API call fails
    onError: () => {
      logoutAction();
      queryClient.clear();
    }
  });
};