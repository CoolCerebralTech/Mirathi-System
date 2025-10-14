// FILE: src/types/auditing.schemas.ts

import { z } from 'zod';
import { UserSchema } from './user.schemas';

// ============================================================================
// SHARED ENUMS
// ============================================================================

/**
 * A controlled vocabulary of all auditable actions within the system.
 * This ensures consistency and makes querying reliable.
 */
export const AuditActionTypeSchema = z.enum([
  // Auth
  'USER_LOGIN_SUCCESS',
  'USER_LOGIN_FAILURE',
  'USER_REGISTERED',
  'USER_LOGOUT',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  // User Management
  'USER_PROFILE_UPDATED',
  'USER_ROLE_CHANGED',
  // Asset Management
  'ASSET_CREATED',
  'ASSET_UPDATED',
  'ASSET_DELETED',
  // Will Management
  'WILL_CREATED',
  'WILL_UPDATED',
  'WILL_STATUS_CHANGED',
  'WILL_EXECUTOR_ASSIGNED',
  // Document Management
  'DOCUMENT_UPLOADED',
  'DOCUMENT_VERIFIED',
  'DOCUMENT_REJECTED',
  'DOCUMENT_DOWNLOADED',
  // Family Management
  'FAMILY_MEMBER_INVITED',
  'FAMILY_MEMBER_REMOVED',
  'RELATIONSHIP_CREATED',
]);

/**
 * The type of entity that an audit log entry pertains to.
 */
export const EntityTypeSchema = z.enum([
  'USER',
  'ASSET',
  'WILL',
  'DOCUMENT',
  'FAMILY_INVITATION',
  'RELATIONSHIP',
]);

// ============================================================================
// API RESPONSE SCHEMA
// ============================================================================

/**
 * Represents a single, immutable audit log entry.
 */
export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime().transform((val) => new Date(val)),
  action: AuditActionTypeSchema,

  // --- Actor ---
  // The user who performed the action. Can be null for system-initiated actions.
  actorId: z.string().uuid().nullable(),
  actor: UserSchema.nullable(),

  // --- Target ---
  // The entity that was affected by the action.
  targetType: EntityTypeSchema,
  targetId: z.string(), // e.g., the UUID of the asset that was created

  // --- Context & Details ---
  status: z.enum(['SUCCESS', 'FAILURE']),
  ipAddress: z
  .string()
  .regex(
    /^(?:\d{1,3}\.){3}\d{1,3}$|^(?:[a-fA-F0-9:]+:+)+[a-fA-F0-9]+$/,
    'Invalid IP address'
  )
  .nullable(),
  /**
   * Stores the state of the data that was changed.
   * - For CREATE actions, only `after` will be present.
   * - For DELETE actions, only `before` will be present.
   * - For UPDATE actions, both `before` and `after` should be present.
   */
  payload: z
  .object({
    before: z.record(z.string(), z.any()).optional(),
    after: z.record(z.string(), z.any()).optional(),
  })
  .nullable(),

});

// ============================================================================
// API QUERY SCHEMA
// ============================================================================

/**
 * Schema for filtering and paginating audit logs.
 */
export const AuditQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  action: AuditActionTypeSchema.optional(),
  actorId: z.string().uuid().optional(),
  targetType: EntityTypeSchema.optional(),
  targetId: z.string().optional(),
  status: z.enum(['SUCCESS', 'FAILURE']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type AuditActionType = z.infer<typeof AuditActionTypeSchema>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AuditQuery = z.infer<typeof AuditQuerySchema>;
