// FILE: src/types/admin.types.ts

import { z } from 'zod';
import { UserRoleSchema, type UserRole } from './shared.types'; 
import { PaginationQuerySchema, PaginationMetaSchema } from './common.types';

// ============================================================================
// CONSTANTS
// ============================================================================

// Type for the action data
type AdminActionData = {
  oldRole?: string;
  newRole?: string;
  duration?: number;
  permanent?: boolean;
  [key: string]: unknown; 
};

export const AdminNotificationTypeSchema = z.enum([
  'system_announcement',
  'security_alert', 
  'feature_update',
  'general'
]);

export const SystemHealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']);

// ============================================================================
// QUERY SCHEMAS (For Filtering/Pagination)
// ============================================================================

/**
 * User query schema for admin user listing
 * Extends the Common Pagination Schema
 */
export const UserQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(), // Explicitly adding search back if needed
  role: UserRoleSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  emailVerified: z.coerce.boolean().optional(),
  phoneVerified: z.coerce.boolean().optional(),
  isLocked: z.coerce.boolean().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  lastLoginFrom: z.string().datetime().optional(),
  lastLoginTo: z.string().datetime().optional(),
});

/**
 * Role change query schema
 */
export const RoleChangeQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  changedBy: z.string().uuid().optional(),
  oldRole: UserRoleSchema.optional(),
  newRole: UserRoleSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

/**
 * Admin audit log query schema
 */
export const AdminAuditLogQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  adminId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  action: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
});

/**
 * System stats query schema
 */
export const SystemStatsQuerySchema = z.object({
  periodDays: z.coerce.number().int().min(1).max(365).default(30),
  includeRoleBreakdown: z.coerce.boolean().default(true),
  includeGrowthMetrics: z.coerce.boolean().default(true),
});

// ============================================================================
// REQUEST SCHEMAS (Admin Actions)
// ============================================================================

export const AdminUpdateUserRequestSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  lockedUntil: z.string().datetime().optional(),
  loginAttempts: z.coerce.number().int().min(0).optional(),
  marketingOptIn: z.boolean().optional(),
});

export const UpdateUserRoleRequestSchema = z.object({
  newRole: UserRoleSchema,
  reason: z.string().max(500).optional(),
  notifyUser: z.boolean().default(true),
});

export const LockUserAccountRequestSchema = z.object({
  durationMinutes: z.coerce.number().int().min(1).optional(),
  reason: z.string().min(1).max(500),
  notifyUser: z.boolean().default(true),
});

export const UnlockUserAccountRequestSchema = z.object({
  reason: z.string().max(500).optional(),
  notifyUser: z.boolean().default(true),
});

export const SoftDeleteUserRequestSchema = z.object({
  reason: z.string().min(1).max(500),
  permanent: z.boolean().default(false),
  notifyUser: z.boolean().default(true),
});

export const RestoreUserRequestSchema = z.object({
  reason: z.string().max(500).optional(),
  reactivate: z.boolean().default(true),
});

export const AdminCreateUserRequestSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  role: UserRoleSchema.default('USER'),
  sendWelcomeEmail: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  marketingOptIn: z.boolean().default(false),
});

export const AdminBulkUpdateUsersRequestSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  lockedUntil: z.string().datetime().optional(),
  loginAttempts: z.coerce.number().int().min(0).optional(),
  reason: z.string().max(500).optional(),
});

export const AdminSendNotificationRequestSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: AdminNotificationTypeSchema.default('system_announcement'),
  sendEmail: z.boolean().default(true),
  sendInApp: z.boolean().default(true),
});

export const AdminSystemMaintenanceRequestSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(1000).optional(),
  estimatedCompletion: z.string().datetime().optional(),
  allowAdminAccess: z.boolean().default(true),
});

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export const BaseResponseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

export const DetailedUserResponseSchema = BaseResponseSchema.extend({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema,
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  lastLoginAt: z.string().datetime().transform((val) => new Date(val)).optional(),
  loginAttempts: z.number(),
  lockedUntil: z.string().datetime().transform((val) => new Date(val)).optional(),
  deletedAt: z.string().datetime().transform((val) => new Date(val)).optional(),
  marketingOptIn: z.boolean(),
  profileCompletion: z.number().min(0).max(100),
  activeSessions: z.number(),
  isLocked: z.boolean(),
  isDeleted: z.boolean(),
});

export const AdminUpdateUserResponseSchema = z.object({
  message: z.string(),
  user: DetailedUserResponseSchema,
  updatedFields: z.array(z.string()),
});

export const UpdateUserRoleResponseSchema = z.object({
  message: z.string(),
  user: DetailedUserResponseSchema,
  previousRole: UserRoleSchema,
  newRole: UserRoleSchema,
  changedBy: z.string(),
  reason: z.string().optional(),
  userNotified: z.boolean(),
});

export const LockUserAccountResponseSchema = z.object({
  message: z.string(),
  userId: z.string().uuid(),
  lockedUntil: z.string().datetime().transform((val) => new Date(val)),
  reason: z.string(),
  lockedBy: z.string(),
  userNotified: z.boolean(),
  sessionsTerminated: z.number(),
});

export const UnlockUserAccountResponseSchema = z.object({
  message: z.string(),
  userId: z.string().uuid(),
  loginAttempts: z.number(),
  reason: z.string().optional(),
  unlockedBy: z.string(),
  userNotified: z.boolean(),
});

export const SoftDeleteUserResponseSchema = z.object({
  message: z.string(),
  userId: z.string().uuid(),
  deletedAt: z.string().datetime().transform((val) => new Date(val)),
  reason: z.string(),
  deletedBy: z.string(),
  permanent: z.boolean(),
  userNotified: z.boolean(),
  sessionsTerminated: z.number(),
  dataScheduledForDeletion: z.array(z.string()),
});

export const RestoreUserResponseSchema = z.object({
  message: z.string(),
  user: DetailedUserResponseSchema,
  reason: z.string().optional(),
  restoredBy: z.string(),
  reactivated: z.boolean(),
});

export const AdminCreateUserResponseSchema = z.object({
  message: z.string(),
  user: DetailedUserResponseSchema,
  temporaryPassword: z.string(),
  emailSent: z.boolean(),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
});

export const AdminBulkUpdateUsersResponseSchema = z.object({
  message: z.string(),
  usersUpdated: z.number().positive(),
  updatedUserIds: z.array(z.string().uuid()),
  failedUserIds: z.array(z.string().uuid()).optional(),
  failures: z.array(z.object({
    userId: z.string().uuid(),
    error: z.string(),
  })).optional(),
  reason: z.string().optional(),
});

// Using PaginationMetaSchema from common
export const PaginatedUsersResponseSchema = z.object({
  data: z.array(DetailedUserResponseSchema),
  meta: PaginationMetaSchema,
});

export const RoleChangeResponseSchema = BaseResponseSchema.extend({
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  userName: z.string(),
  oldRole: UserRoleSchema,
  newRole: UserRoleSchema,
  changedBy: z.string().optional(),
  reason: z.string().optional(),
});

export const PaginatedRoleChangesResponseSchema = z.object({
  data: z.array(RoleChangeResponseSchema),
  meta: PaginationMetaSchema,
});

export const UserStatsResponseSchema = z.object({
  total: z.number().positive(),
  active: z.number().positive(),
  inactive: z.number(),
  deleted: z.number(),
  locked: z.number(),
  newLast30Days: z.number(),
  byRole: z.record(UserRoleSchema, z.number()),
  emailVerified: z.number(),
  phoneVerified: z.number(),
  averageProfileCompletion: z.number().min(0).max(100),
  activeLast24Hours: z.number(),
  growthRate: z.number(),
});

export const GetUserResponseSchema = DetailedUserResponseSchema.extend({
  sessions: z.array(z.object({
    id: z.string().uuid(),
    createdAt: z.string().datetime().transform((val) => new Date(val)),
    lastActivity: z.string().datetime().transform((val) => new Date(val)),
    expiresAt: z.string().datetime().transform((val) => new Date(val)),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    deviceId: z.string().optional(),
  })).optional(),
  roleHistory: z.array(z.object({
    oldRole: UserRoleSchema,
    newRole: UserRoleSchema,
    changedBy: z.string(),
    reason: z.string().optional(),
    changedAt: z.string().datetime().transform((val) => new Date(val)),
  })).optional(),
});

export const AdminAuditLogResponseSchema = BaseResponseSchema.extend({
  adminId: z.string().uuid(),
  adminEmail: z.string().email(),
  targetUserId: z.string().uuid().optional(),
  targetUserEmail: z.string().email().optional(),
  action: z.string(),
  description: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.string(), z.any()), 
});

export const PaginatedAuditLogResponseSchema = z.object({
  data: z.array(AdminAuditLogResponseSchema),
  meta: PaginationMetaSchema,
});

export const AdminSendNotificationResponseSchema = z.object({
  message: z.string(),
  usersNotified: z.number().positive(),
  emailsSent: z.number().positive(),
  inAppNotificationsSent: z.number().positive(),
  failedUsers: z.array(z.string().uuid()).optional(),
});

export const SystemMaintenanceResponseSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  estimatedCompletion: z.string().datetime().optional(),
  allowAdminAccess: z.boolean(),
  enabledAt: z.string().datetime().transform((val) => new Date(val)),
  enabledBy: z.string(),
});

export const SystemHealthResponseSchema = z.object({
  status: SystemHealthStatusSchema,
  database: z.boolean(),
  cache: z.boolean(),
  messageBroker: z.boolean(),
  externalServices: z.boolean(),
  uptime: z.number().positive(),
  memoryUsage: z.number().min(0).max(100),
  cpuUsage: z.number().min(0).max(100),
  activeConnections: z.number().positive(),
  responseTime: z.number().positive(),
  lastChecked: z.string().datetime().transform((val) => new Date(val)),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type AdminNotificationType = z.infer<typeof AdminNotificationTypeSchema>;
export type SystemHealthStatus = z.infer<typeof SystemHealthStatusSchema>;

export type UserQuery = z.infer<typeof UserQuerySchema>;
export type RoleChangeQuery = z.infer<typeof RoleChangeQuerySchema>;
export type AdminAuditLogQuery = z.infer<typeof AdminAuditLogQuerySchema>;
export type SystemStatsQuery = z.infer<typeof SystemStatsQuerySchema>;

export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserRequestSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleRequestSchema>;
export type LockUserAccountInput = z.infer<typeof LockUserAccountRequestSchema>;
export type UnlockUserAccountInput = z.infer<typeof UnlockUserAccountRequestSchema>;
export type SoftDeleteUserInput = z.infer<typeof SoftDeleteUserRequestSchema>;
export type RestoreUserInput = z.infer<typeof RestoreUserRequestSchema>;
export type AdminCreateUserInput = z.infer<typeof AdminCreateUserRequestSchema>;
export type AdminBulkUpdateUsersInput = z.infer<typeof AdminBulkUpdateUsersRequestSchema>;
export type AdminSendNotificationInput = z.infer<typeof AdminSendNotificationRequestSchema>;
export type AdminSystemMaintenanceInput = z.infer<typeof AdminSystemMaintenanceRequestSchema>;

export type DetailedUserResponse = z.infer<typeof DetailedUserResponseSchema>;
export type AdminUpdateUserResponse = z.infer<typeof AdminUpdateUserResponseSchema>;
export type UpdateUserRoleResponse = z.infer<typeof UpdateUserRoleResponseSchema>;
export type LockUserAccountResponse = z.infer<typeof LockUserAccountResponseSchema>;
export type UnlockUserAccountResponse = z.infer<typeof UnlockUserAccountResponseSchema>;
export type SoftDeleteUserResponse = z.infer<typeof SoftDeleteUserResponseSchema>;
export type RestoreUserResponse = z.infer<typeof RestoreUserResponseSchema>;
export type AdminCreateUserResponse = z.infer<typeof AdminCreateUserResponseSchema>;
export type AdminBulkUpdateUsersResponse = z.infer<typeof AdminBulkUpdateUsersResponseSchema>;
export type PaginatedUsersResponse = z.infer<typeof PaginatedUsersResponseSchema>;
export type RoleChangeResponse = z.infer<typeof RoleChangeResponseSchema>;
export type PaginatedRoleChangesResponse = z.infer<typeof PaginatedRoleChangesResponseSchema>;
export type UserStatsResponse = z.infer<typeof UserStatsResponseSchema>;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
export type AdminAuditLogResponse = z.infer<typeof AdminAuditLogResponseSchema>;
export type PaginatedAuditLogResponse = z.infer<typeof PaginatedAuditLogResponseSchema>;
export type AdminSendNotificationResponse = z.infer<typeof AdminSendNotificationResponseSchema>;
export type SystemMaintenanceResponse = z.infer<typeof SystemMaintenanceResponseSchema>;
export type SystemHealthResponse = z.infer<typeof SystemHealthResponseSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const isAdminUser = (user: { role: UserRole }): boolean => {
  return user.role === 'ADMIN';
};

export const isManageableUser = (targetUser: { role: UserRole }, currentUser: { role: UserRole }): boolean => {
  return targetUser.role !== 'ADMIN' || targetUser.role === currentUser.role;
};

export const getUserStatus = (user: DetailedUserResponse): string => {
  if (user.isDeleted) return 'Deleted';
  if (user.isLocked) return 'Locked';
  if (!user.isActive) return 'Inactive';
  return 'Active';
};

export const getUserStatusColor = (user: DetailedUserResponse): string => {
  if (user.isDeleted) return 'red';
  if (user.isLocked) return 'orange';
  if (!user.isActive) return 'yellow';
  return 'green';
};

export const formatUserForAdmin = (user: DetailedUserResponse) => {
  return {
    ...user,
    status: getUserStatus(user),
    statusColor: getUserStatusColor(user),
    displayName: `${user.firstName} ${user.lastName}`,
    initials: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase(),
  };
};

export const calculateLockDuration = (lockedUntil?: Date): number | null => {
  if (!lockedUntil) return null;
  const now = new Date();
  const diffMs = lockedUntil.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60)));
};

export const isPermanentLock = (lockedUntil?: Date): boolean => {
  if (!lockedUntil) return false;
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  return lockedUntil > oneYearFromNow;
};

export const validateAdminActionReason = (reason: string, action: string): string | null => {
  if (!reason && action !== 'unlock') {
    return 'Reason is required for this action';
  }
  if (reason && reason.length > 500) {
    return 'Reason cannot exceed 500 characters';
  }
  return null;
};

export const getAdminActionDescription = (
  action: string, 
  targetUser: DetailedUserResponse, 
  data?: AdminActionData
): string => {
  const userName = `${targetUser.firstName} ${targetUser.lastName}`;
  
  switch (action) {
    case 'role_change':
      return `Changed ${userName}'s role from ${data?.oldRole} to ${data?.newRole}`;
    case 'lock_account':
      return `Locked ${userName}'s account${data?.duration ? ` for ${data.duration} minutes` : ''}`;
    case 'unlock_account':
      return `Unlocked ${userName}'s account`;
    case 'delete_account':
      return `${data?.permanent ? 'Permanently deleted' : 'Soft deleted'} ${userName}'s account`;
    case 'restore_account':
      return `Restored ${userName}'s account`;
    case 'update_user':
      return `Updated ${userName}'s profile information`;
    default:
      return `Performed ${action} on ${userName}`;
  }
};