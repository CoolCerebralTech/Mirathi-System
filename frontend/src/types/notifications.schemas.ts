// FILE: src/types/schemas/notifications.schemas.ts

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const NotificationStatusSchema = z.enum(['PENDING', 'SENT', 'FAILED']);
export const NotificationChannelSchema = z.enum(['EMAIL', 'SMS']);

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  channel: NotificationChannelSchema,
  status: NotificationStatusSchema,
  sentAt: z.string().datetime().nullable(),
  failReason: z.string().nullable(),
  templateId: z.string().uuid(),
  recipientId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export const NotificationQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  status: NotificationStatusSchema.optional(),
  channel: NotificationChannelSchema.optional(),
  sortBy: z.enum(['createdAt', 'status', 'channel']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// NOTIFICATION TEMPLATE SCHEMAS (Admin-facing)
// ============================================================================

export const NotificationTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  channel: NotificationChannelSchema,
  subject: z.string().nullable(),
  body: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateTemplateSchema = z.object({
  name: z
    .string()
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name cannot exceed 100 characters'),
  channel: NotificationChannelSchema,
  subject: z.string().max(200).optional(),
  body: z.string().min(10, 'Template body must be at least 10 characters'),
});

export const UpdateTemplateSchema = z.object({
  name: z
    .string()
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name cannot exceed 100 characters')
    .optional(),
  channel: NotificationChannelSchema.optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(10, 'Template body must be at least 10 characters').optional(),
});

export const TemplateQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  channel: NotificationChannelSchema.optional(),
  sortBy: z.enum(['createdAt', 'name', 'channel']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

// Enum types
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

// Response types
export type Notification = z.infer<typeof NotificationResponseSchema>;
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;

// Request types
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;

// Query types
export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
export type TemplateQuery = z.infer<typeof TemplateQuerySchema>;