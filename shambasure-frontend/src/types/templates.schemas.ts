// FILE: src/types/templates.schemas.ts

import { z } from 'zod';
import { NotificationChannelSchema } from './notifications.schemas'; // UPGRADE: Corrected import path

// ============================================================================
// API RESPONSE SCHEMA
// ============================================================================

export const TemplateResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  channel: NotificationChannelSchema,
  subject: z.string().nullable(),
  body: z.string(),
  variables: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// FORM/REQUEST SCHEMAS
// ============================================================================

export const CreateTemplateRequestSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters."),
  channel: NotificationChannelSchema,
  subject: z.string().optional(),
  body: z.string().min(10, "Template body must be at least 10 characters."),
  variables: z.array(z.string()).min(1, 'At least one variable is required.'),
  isActive: z.boolean().optional(),
});

export const UpdateTemplateRequestSchema = CreateTemplateRequestSchema.partial();

// ============================================================================
// QUERY SCHEMA
// ============================================================================

// UPGRADE: Added the missing schema for query parameters.
export const TemplateQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  channel: NotificationChannelSchema.optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type Template = z.infer<typeof TemplateResponseSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateRequestSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateRequestSchema>;
export type TemplateQuery = z.infer<typeof TemplateQuerySchema>;
