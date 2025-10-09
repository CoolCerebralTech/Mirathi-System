// ============================================================================
// Shamba Sure - Notification Provider Interface
// ============================================================================
// This interface defines the contract for any service that can send a
// notification (e.g., Email, SMS). This allows our core NotificationsService
// to be completely decoupled from the specific sending mechanism.
// ============================================================================

export interface SendNotificationOptions {
  to: string;
  body: string;
  subject?: string; // Primarily for email
  from?: string; // Optional sender override
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const NOTIFICATION_PROVIDER = 'NOTIFICATION_PROVIDER';

export interface NotificationProvider {
  send(options: SendNotificationOptions): Promise<SendNotificationResult>;
  getHealth(): Promise<{ status: 'up' | 'down'; details?: string }>;
}