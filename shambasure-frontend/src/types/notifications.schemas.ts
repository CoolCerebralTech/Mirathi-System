// FILE: src/types/notifications.schemas.ts

import { z } from 'zod';

// ============================================================================
// SHARED ENUMS
// ============================================================================

/**
 * Defines the channel for a notification's delivery attempt.
 * IN_APP is for display within the application UI (e.g., a notification bell).
 */
export const NotificationChannelSchema = z.enum(['IN_APP', 'EMAIL', 'SMS']);

/**
 * A controlled list of notification types.
 * This allows the UI to render different icons or messages based on the event.
 */
export const NotificationTypeSchema = z.enum([
  // Account & Security
  'WELCOME_MESSAGE',
  'PASSWORD_CHANGED',
  // Documents
  'DOCUMENT_VERIFIED',
  'DOCUMENT_REJECTED',
  'DOCUMENT_UPLOAD_SUCCESS',
  // Wills & Succession
  'WILL_STATUS_UPDATED',
  'EXECUTOR_ASSIGNED',
  'BENEFICIARY_ASSIGNED',
  // Family & Heirs
  'NEW_FAMILY_INVITATION',
  'FAMILY_INVITATION_ACCEPTED',
  // Reminders
  'UPCOMING_DOCUMENT_EXPIRY',
  'WILL_REVIEW_REMINDER',
]);

// ============================================================================
// PRIMARY SCHEMA (For In-App User Experience)
// ============================================================================

/**
 * Represents a notification intended for display to a user within the application.
 * This is the primary schema the frontend will interact with.
 */
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  recipientId: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  /** A URL path for the client to navigate to when the notification is clicked. */
  link: z.string().optional(),
  /** Timestamp for when the user marked the notification as read. Null if unread. */
  readAt: z.string().datetime().transform((val) => new Date(val)).nullable(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
});

// ============================================================================
// ADMINISTRATIVE SCHEMA (For Auditing Delivery)
// ============================================================================

/**
 * Represents a log of an attempt to deliver a notification via an external channel.
 * This is primarily for backend/admin auditing.
 */
export const NotificationDeliveryLogSchema = z.object({
  id: z.string().uuid(),
  // The in-app notification this delivery attempt corresponds to.
  notificationId: z.string().uuid(),
  channel: z.enum(['EMAIL', 'SMS']), // Delivery logs are only for external channels
  status: z.enum(['PENDING', 'SENT', 'FAILED']),
  sentAt: z.string().datetime().transform((val) => new Date(val)).nullable(),
  failReason: z.string().nullable(),
  recipientAddress: z.string(), // The actual email address or phone number
  createdAt: z.string().datetime().transform((val) => new Date(val)),
});

// ============================================================================
// FORM/REQUEST SCHEMAS
// ============================================================================

/**
 * Schema for marking one or more notifications as read.
 */
export const MarkNotificationsAsReadSchema = z.object({
  /** An array of notification IDs to mark as read. If empty or omitted, all unread notifications for the user will be marked as read. */
  notificationIds: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// API QUERY SCHEMAS
// ============================================================================

/**
 * Schema for querying a user's in-app notifications.
 */
export const NotificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  /** Filter by read or unread status. */
  isRead: z.boolean().optional(),
  type: NotificationTypeSchema.optional(),
});

/**
 * Schema for querying notification delivery logs (for admins).
 */
export const DeliveryLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
  channel: z.enum(['EMAIL', 'SMS']).optional(),
  recipientId: z.string().uuid().optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationDeliveryLog = z.infer<
  typeof NotificationDeliveryLogSchema
>;

export type MarkNotificationsAsReadInput = z.infer<
  typeof MarkNotificationsAsReadSchema
>;
export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
export type DeliveryLogQuery = z.infer<typeof DeliveryLogQuerySchema>;
