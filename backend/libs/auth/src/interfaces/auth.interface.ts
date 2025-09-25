import { UserRole } from '@shamba/common';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  tokens: TokenPair;
}

export interface PasswordResetToken {
  token: string;
  expiresAt: Date;
  userId: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  lastActive: Date;
  expiresAt: Date;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiration: string;
  refreshTokenSecret: string;
  refreshTokenExpiration: string;
  bcryptRounds: number;
  maxLoginAttempts: number;
  sessionTimeout: number;
}