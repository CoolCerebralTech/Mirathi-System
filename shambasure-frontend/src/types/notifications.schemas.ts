// FILE: src/types/notifications.schemas.ts

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const NotificationChannelSchema = z.enum(['EMAIL', 'SMS']);
export const NotificationStatusSchema = z.enum(['PENDING', 'SENT', 'FAILED']);

// ============================================================================
// API RESPONSE SCHEMA
// ============================================================================

export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  channel: NotificationChannelSchema,
  status: NotificationStatusSchema,
  sentAt: z.string().datetime().nullable(),
  failReason: z.string().nullable(),
  recipientId: z.string().uuid().nullable(),
  templateName: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// QUERY SCHEMA (for filtering)
// ============================================================================

// UPGRADE: Added the missing schema for query parameters.
export const NotificationQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  status: NotificationStatusSchema.optional(),
  channel: NotificationChannelSchema.optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type Notification = z.infer<typeof NotificationResponseSchema>;
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;
export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
