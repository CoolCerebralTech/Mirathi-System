import { UserRole } from '@prisma/client';

import {
  EmailChangeToken,
  EmailVerificationToken,
  LoginSession,
  PasswordResetToken,
  PhoneVerificationToken,
  RefreshToken,
} from '../models/token.model';
import { UserProfile } from '../models/user-profile.model';
import { User, UserProps } from '../models/user.model';
import { Email, PhoneNumber } from '../value-objects';

// ============================================================================
// SHARED TYPES
// ============================================================================

/** Pagination options. */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Represents a paginated list of results. */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ============================================================================
// USER REPOSITORY
// ============================================================================

export type UserUpdateData = Partial<
  Pick<UserProps, 'role' | 'isActive' | 'lockedUntil' | 'loginAttempts'>
>;

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  isDeleted?: boolean;
  isLocked?: boolean;
  emailVerified?: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  byRole: Record<UserRole, number>;
  newLast30Days: number;
  locked: number;
  newLast7Days?: number;
  loginLast24Hours?: number;
  emailVerified?: number;
  phoneVerified?: number;
}

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByEmailWithProfile(email: Email): Promise<User | null>;
  findByIdWithProfile(id: string): Promise<User | null>;
  findAll(filters: UserFilters, pagination: PaginationOptions): Promise<PaginatedResult<User>>;
  existsByEmail(email: Email): Promise<boolean>;
  isPhoneNumberUnique(phoneNumber: PhoneNumber): Promise<boolean>;
  getStats(): Promise<UserStats>;
  bulkUpdate(userIds: string[], data: UserUpdateData): Promise<number>;
  bulkUpdateProfiles(userIds: string[], data: { emailVerified?: boolean }): Promise<number>;
  findRoleChangesByUserId(userId: string): Promise<unknown[]>;
  findByRole(role: UserRole, limit?: number): Promise<User[]>;
}

// ============================================================================
// USER PROFILE REPOSITORY
// ============================================================================

export interface ProfileFilters {
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  hasMarketingOptIn?: boolean;
  isComplete?: boolean;
}

export interface IUserProfileRepository {
  saveProfile(profile: UserProfile): Promise<void>;

  findProfileById(id: string): Promise<UserProfile | null>;
  findProfileByUserId(userId: string): Promise<UserProfile | null>;
  findProfileByPhoneNumber(phoneNumber: PhoneNumber): Promise<UserProfile | null>;

  deleteProfile(id: string): Promise<void>;
  findAllProfiles(filters: ProfileFilters): Promise<UserProfile[]>;
}

// ============================================================================
// PASSWORD RESET TOKEN REPOSITORY
// ============================================================================

export interface IPasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<void>;
  findById(id: string): Promise<PasswordResetToken | null>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  findByUserId(userId: string): Promise<PasswordResetToken[]>;
  findActiveByUserId(userId: string): Promise<PasswordResetToken | null>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteUsed(): Promise<number>;
  countByUserId(userId: string): Promise<number>;
}

// ============================================================================
// EMAIL VERIFICATION TOKEN REPOSITORY
// ============================================================================

export interface IEmailVerificationTokenRepository {
  save(token: EmailVerificationToken): Promise<void>;
  findById(id: string): Promise<EmailVerificationToken | null>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  findByUserId(userId: string): Promise<EmailVerificationToken | null>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  existsByUserId(userId: string): Promise<boolean>;
}

// ============================================================================
// PHONE VERIFICATION TOKEN REPOSITORY
// ============================================================================

export interface IPhoneVerificationTokenRepository {
  save(token: PhoneVerificationToken): Promise<void>;
  findById(id: string): Promise<PhoneVerificationToken | null>;
  findByTokenHash(tokenHash: string): Promise<PhoneVerificationToken | null>;
  findActiveByUserId(userId: string): Promise<PhoneVerificationToken | null>;
  findByUserId(userId: string): Promise<PhoneVerificationToken[]>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteUsed(): Promise<number>;
  countActiveByUserId(userId: string): Promise<number>;
  countByUserId(userId: string): Promise<number>;
}

// ============================================================================
// EMAIL CHANGE TOKEN REPOSITORY
// ============================================================================

export interface IEmailChangeTokenRepository {
  save(token: EmailChangeToken): Promise<void>;
  findById(id: string): Promise<EmailChangeToken | null>;
  findByTokenHash(tokenHash: string): Promise<EmailChangeToken | null>;
  findActiveByUserId(userId: string): Promise<EmailChangeToken | null>;
  findByUserId(userId: string): Promise<EmailChangeToken[]>;
  findByNewEmail(newEmail: string): Promise<EmailChangeToken[]>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteUsed(): Promise<number>;
  existsByNewEmail(newEmail: string): Promise<boolean>;
}

// ============================================================================
// REFRESH TOKEN REPOSITORY
// ============================================================================

export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findById(id: string): Promise<RefreshToken | null>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  findByUserId(userId: string): Promise<RefreshToken[]>;
  findActiveByUserId(userId: string): Promise<RefreshToken[]>;
  findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<RefreshToken[]>;
  revokeAllByUserId(userId: string): Promise<number>;
  revokeByDeviceId(userId: string, deviceId: string): Promise<number>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteRevoked(): Promise<number>;
  countActiveByUserId(userId: string): Promise<number>;
}

// ============================================================================
// LOGIN SESSION REPOSITORY
// ============================================================================

export interface SessionStats {
  total: number;
  active: number;
  revoked: number;
  expired: number;
  activeUsersLast24Hours: number;
}

export interface ILoginSessionRepository {
  save(session: LoginSession): Promise<void>;
  findById(id: string): Promise<LoginSession | null>;
  findByTokenHash(tokenHash: string): Promise<LoginSession | null>;
  findByUserId(userId: string): Promise<LoginSession[]>;
  findActiveByUserId(userId: string): Promise<LoginSession[]>;
  findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<LoginSession[]>;
  revokeAllByUserId(userId: string): Promise<number>;
  revokeByDeviceId(userId: string, deviceId: string): Promise<number>;
  revokeById(sessionId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteRevoked(): Promise<number>;
  deleteInactive(): Promise<number>;
  getStats(): Promise<SessionStats>;
  countActiveByUserId(userId: string): Promise<number>;
  findRecentlyActive(limit: number): Promise<LoginSession[]>;
}

// ============================================================================
// PASSWORD HISTORY REPOSITORY
// ============================================================================

export interface PasswordHistory {
  id: string;
  userId: string;
  passwordHash: string;
  createdAt: Date;
}

export interface IPasswordHistoryRepository {
  save(userId: string, passwordHash: string): Promise<void>;
  findByUserId(userId: string, limit: number): Promise<PasswordHistory[]>;
  deleteOldestByUserId(userId: string, keepCount: number): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}
