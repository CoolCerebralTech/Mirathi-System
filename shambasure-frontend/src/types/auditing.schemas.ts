// FILE: src/types/auditing.schemas.ts

import { z } from 'zod';
import { UserSchema } from './user.schemas';

// ============================================================================
// API RESPONSE SCHEMA
// ============================================================================

export const AuditLogResponseSchema = z.object({
  
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  actorId: z.string().uuid().nullable(),
  action: z.string(),
  payload: z.record(z.string(), z.any()), 
  actor: UserSchema.nullable(),
});

// ============================================================================
// QUERY SCHEMA (for filtering)
// ============================================================================

export const AuditQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  action: z.string().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type AuditLog = z.infer<typeof AuditLogResponseSchema>;
export type AuditQuery = z.infer<typeof AuditQuerySchema>;
