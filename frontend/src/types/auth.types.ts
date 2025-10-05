// src/types/auth.types.ts
// ============================================================================
// Authentication-Related Type Definitions
// ============================================================================
// - Defines the shape of all data specifically used in the authentication
//   and user session lifecycle (login, registration, password reset).
// ============================================================================

import type { UserRole, User } from './user.types';

// REQUESTS (Data we send TO the API)

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

// RESPONSE (Data we receive FROM the API)

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User; // Re-use the master User type
}