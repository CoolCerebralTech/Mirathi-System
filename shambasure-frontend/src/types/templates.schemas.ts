// FILE: src/types/templates.schemas.ts

import { z } from 'zod';
import {
  NotificationChannelSchema,
  NotificationTypeSchema,
} from './notifications.schemas';

// ============================================================================
// API RESPONSE SCHEMA (Data shape received from the server)
// ============================================================================

/**
 * Represents a single notification template stored in the system.
 */
export const TemplateSchema = z.object({
  id: z.string().uuid(),
  /** A human-friendly name for administrative purposes. */
  name: z.string(),
  /** A brief explanation of what this template is used for. */
  description: z.string().nullable(),
  /**
   * The programmatic link to a system event. This is the key used by the backend
   * to select the correct template for a given notification.
   */
  templateType: NotificationTypeSchema,
  channel: NotificationChannelSchema,
  subject: z.string().nullable(),
  body: z.string(),
  /** A list of placeholder variables (e.g., "{{firstName}}") available in this template. */
  variables: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

// ============================================================================
// FORM/REQUEST SCHEMAS (Payloads sent to the server)
// ============================================================================

/**
 * Base schema for creating and updating templates, with cross-field validation.
 */
const BaseTemplateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Template name must be at least 3 characters')
      .max(100, 'Template name cannot exceed 100 characters'),
    description: z.string().trim().max(500).optional(),
    templateType: NotificationTypeSchema,
    channel: NotificationChannelSchema,
    subject: z.string().trim().max(255).optional(),
    body: z
      .string()
      .trim()
      .min(10, 'Template body must be at least 10 characters')
      .max(10000, 'Template body cannot exceed 10,000 characters'),
    variables: z
      .array(z.string().trim())
      .max(50, 'Cannot define more than 50 variables')
      .default([]),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // If the channel is EMAIL, a subject line is required.
      if (data.channel === 'EMAIL') {
        return !!data.subject && data.subject.length > 0;
      }
      return true;
    },
    {
      message: 'Subject is required for EMAIL templates',
      path: ['subject'], // Point the error to the subject field for better UX
    },
  );

/**
 * Schema for CREATING a new template.
 */
export const CreateTemplateSchema = BaseTemplateSchema;

/**
 * Schema for UPDATING an existing template. All fields are optional.
 */
export const UpdateTemplateSchema = BaseTemplateSchema.partial();

// ============================================================================
// API QUERY SCHEMA
// ============================================================================

/**
 * Schema for filtering and paginating notification templates.
 */
export const TemplateQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  channel: NotificationChannelSchema.optional(),
  templateType: NotificationTypeSchema.optional(),
  isActive: z.boolean().optional(),
  /** Search by template name or description. */
  search: z.string().optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type Template = z.infer<typeof TemplateSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type TemplateQuery = z.infer<typeof TemplateQuerySchema>;
