// ============================================================================
// admin.schemas.ts - Admin Management Validation Schemas
// ============================================================================
// Admin-only operations with sensitive user data and system management
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * User roles from Prisma schema
 */
export const UserRoleSchema = z.enum(['USER', 'ADMIN', 'VERIFIER', 'AUDITOR']);

/**
 * Notification types for admin notifications
 */
export const AdminNotificationTypeSchema = z.enum([
  'system_announcement',
  'security_alert', 
  'feature_update',
  'general'
]);

/**
 * System health status
 */
export const SystemHealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']);

// ============================================================================
// QUERY SCHEMAS (For Filtering/Pagination)
// ============================================================================

/**
 * Base pagination query schema
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

/**
 * User query schema for admin user listing
 */
export const UserQuerySchema = PaginationQuerySchema.extend({
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

/**
 * Admin update user request schema
 */
export const AdminUpdateUserRequestSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .optional(),
  email: z
    .string()
    .email('Please provide a valid email address')
    .optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  lockedUntil: z.string().datetime().optional(),
  loginAttempts: z.coerce.number().int().min(0).optional(),
  marketingOptIn: z.boolean().optional(),
});

/**
 * Update user role request schema
 */
export const UpdateUserRoleRequestSchema = z.object({
  newRole: UserRoleSchema,
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
  notifyUser: z.boolean().default(true),
});

/**
 * Lock user account request schema
 */
export const LockUserAccountRequestSchema = z.object({
  durationMinutes: z.coerce.number().int().min(1).optional(),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters'),
  notifyUser: z.boolean().default(true),
});

/**
 * Unlock user account request schema
 */
export const UnlockUserAccountRequestSchema = z.object({
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
  notifyUser: z.boolean().default(true),
});

/**
 * Soft delete user request schema
 */
export const SoftDeleteUserRequestSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters'),
  permanent: z.boolean().default(false),
  notifyUser: z.boolean().default(true),
});

/**
 * Restore user request schema
 */
export const RestoreUserRequestSchema = z.object({
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
  reactivate: z.boolean().default(true),
});

/**
 * Admin create user request schema
 */
export const AdminCreateUserRequestSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Please provide a valid email address'),
  role: UserRoleSchema.default('USER'),
  sendWelcomeEmail: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  marketingOptIn: z.boolean().default(false),
});

/**
 * Admin bulk update users request schema
 */
export const AdminBulkUpdateUsersRequestSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  lockedUntil: z.string().datetime().optional(),
  loginAttempts: z.coerce.number().int().min(0).optional(),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
});

/**
 * Admin send notification request schema
 */
export const AdminSendNotificationRequestSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject cannot exceed 200 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message cannot exceed 2000 characters'),
  type: AdminNotificationTypeSchema.default('system_announcement'),
  sendEmail: z.boolean().default(true),
  sendInApp: z.boolean().default(true),
});

/**
 * Admin system maintenance request schema
 */
export const AdminSystemMaintenanceRequestSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(1000, 'Message cannot exceed 1000 characters').optional(),
  estimatedCompletion: z.string().datetime().optional(),
  allowAdminAccess: z.boolean().default(true),
});

// ============================================================================
// RESPONSE SCHEMAS (Admin Outputs)
// ============================================================================

/**
 * Base response schema with common fields
 */
export const BaseResponseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * Pagination meta schema
 */
export const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

/**
 * Detailed user response schema with admin-only fields
 */
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

/**
 * Admin update user response schema
 */
export const AdminUpdateUserResponseSchema = z.object({
  message: z.string(),
  user: DetailedUserResponseSchema,
  updatedFields: z.array(z.string()),
});

/**
 * Update user role response schema
 */
export const UpdateUserRoleResponseSchema = z.object({
  message: z.string(),
  user: DetailedUserResponseSchema,
  previousRole: UserRoleSchema,
  newRole: UserRoleSchema,
  changedBy: z.string(),
  reason: z.string().optional(),
  userNotified: z.boolean(),
});

/**
 * Lock user account response schema
 */
export const LockUserAccountResponseSchema = z.object({
  message: z.string(),
  userId: z.string().uuid(),
  lockedUntil: z.string().datetime().transform((val) => new Date(val)),
  reason: z.string(),
  lockedBy: z.string(),
  userNotified: z.boolean(),
  sessionsTerminated: z.number(),
});

/**
 * Unlock user account response schema
 */
export const UnlockUserAccountResponseSchema = z.object({
  message: z.string(),
  userId: z.string().uuid(),
  loginAttempts: z.number(),
  reason: z.string().optional(),
  unlockedBy: z.string(),
  userNotified: z.boolean(),
});

/**
 * Soft delete user response schema
 */
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

/**
 * Restore user response schema
 */
export const RestoreUserResponseSchema = z.object({
  message: z.string(),
  user: DetailedUserResponseSchema,
  reason: z.string().optional(),
  restoredBy: z.string(),
  reactivated: z.boolean(),
});

/**
 * Admin create user response schema
 */
export const AdminCreateUserResponseSchema = z.object({
  message: z.string(),
  user: DetailedUserResponseSchema,
  temporaryPassword: z.string(),
  emailSent: z.boolean(),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
});

/**
 * Admin bulk update users response schema
 */
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

/**
 * Paginated users response schema
 */
export const PaginatedUsersResponseSchema = z.object({
  data: z.array(DetailedUserResponseSchema),
  meta: PaginationMetaSchema,
});

/**
 * Role change response schema
 */
export const RoleChangeResponseSchema = BaseResponseSchema.extend({
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  userName: z.string(),
  oldRole: UserRoleSchema,
  newRole: UserRoleSchema,
  changedBy: z.string().optional(),
  reason: z.string().optional(),
});

/**
 * Paginated role changes response schema
 */
export const PaginatedRoleChangesResponseSchema = z.object({
  data: z.array(RoleChangeResponseSchema),
  meta: PaginationMetaSchema,
});

/**
 * User stats response schema
 */
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

/**
 * Get user response schema with extended data
 */
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

/**
 * Admin audit log response schema
 */
export const AdminAuditLogResponseSchema = BaseResponseSchema.extend({
  adminId: z.string().uuid(),
  adminEmail: z.string().email(),
  targetUserId: z.string().uuid().optional(),
  targetUserEmail: z.string().email().optional(),
  action: z.string(),
  description: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()),
});

/**
 * Paginated audit log response schema
 */
export const PaginatedAuditLogResponseSchema = z.object({
  data: z.array(AdminAuditLogResponseSchema),
  meta: PaginationMetaSchema,
});

/**
 * Admin send notification response schema
 */
export const AdminSendNotificationResponseSchema = z.object({
  message: z.string(),
  usersNotified: z.number().positive(),
  emailsSent: z.number().positive(),
  inAppNotificationsSent: z.number().positive(),
  failedUsers: z.array(z.string().uuid()).optional(),
});

/**
 * System maintenance response schema
 */
export const SystemMaintenanceResponseSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  estimatedCompletion: z.string().datetime().optional(),
  allowAdminAccess: z.boolean(),
  enabledAt: z.string().datetime().transform((val) => new Date(val)),
  enabledBy: z.string(),
});

/**
 * System health response schema
 */
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

export type UserRole = z.infer<typeof UserRoleSchema>;
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
// UTILITY FUNCTIONS AND CONSTANTS
// ============================================================================

/**
 * Check if a user has admin privileges
 */
export const isAdminUser = (user: { role: UserRole }): boolean => {
  return user.role === 'ADMIN';
};

/**
 * Check if a user can be managed by admin (not another admin)
 */
export const isManageableUser = (targetUser: { role: UserRole }, currentUser: { role: UserRole }): boolean => {
  // Admins can only manage non-admin users, unless it's self-management for certain operations
  return targetUser.role !== 'ADMIN' || targetUser.role === currentUser.role;
};

/**
 * Get user status for display in admin interfaces
 */
export const getUserStatus = (user: DetailedUserResponse): string => {
  if (user.isDeleted) return 'Deleted';
  if (user.isLocked) return 'Locked';
  if (!user.isActive) return 'Inactive';
  return 'Active';
};

/**
 * Get status badge color for admin UI
 */
export const getUserStatusColor = (user: DetailedUserResponse): string => {
  if (user.isDeleted) return 'red';
  if (user.isLocked) return 'orange';
  if (!user.isActive) return 'yellow';
  return 'green';
};

/**
 * Format user data for admin display
 */
export const formatUserForAdmin = (user: DetailedUserResponse) => {
  return {
    ...user,
    status: getUserStatus(user),
    statusColor: getUserStatusColor(user),
    displayName: `${user.firstName} ${user.lastName}`,
    initials: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase(),
  };
};

/**
 * Calculate lock duration in minutes
 */
export const calculateLockDuration = (lockedUntil?: Date): number | null => {
  if (!lockedUntil) return null;
  const now = new Date();
  const diffMs = lockedUntil.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60)));
};

/**
 * Check if a lock is permanent
 */
export const isPermanentLock = (lockedUntil?: Date): boolean => {
  if (!lockedUntil) return false;
  // Consider locks more than 1 year as permanent
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  return lockedUntil > oneYearFromNow;
};

/**
 * Validate admin action reason
 */
export const validateAdminActionReason = (reason: string, action: string): string | null => {
  if (!reason && action !== 'unlock') {
    return 'Reason is required for this action';
  }
  if (reason && reason.length > 500) {
    return 'Reason cannot exceed 500 characters';
  }
  return null;
};

/**
 * Get admin action description for audit logs
 */
export const getAdminActionDescription = (action: string, targetUser: DetailedUserResponse, data?: any): string => {
  const userName = `${targetUser.firstName} ${targetUser.lastName}`;
  
  switch (action) {
    case 'role_change':
      return `Changed ${userName}'s role from ${data.oldRole} to ${data.newRole}`;
    case 'lock_account':
      return `Locked ${userName}'s account${data.duration ? ` for ${data.duration} minutes` : ''}`;
    case 'unlock_account':
      return `Unlocked ${userName}'s account`;
    case 'delete_account':
      return `${data.permanent ? 'Permanently deleted' : 'Soft deleted'} ${userName}'s account`;
    case 'restore_account':
      return `Restored ${userName}'s account`;
    case 'update_user':
      return `Updated ${userName}'s profile information`;
    default:
      return `Performed ${action} on ${userName}`;
  }
};