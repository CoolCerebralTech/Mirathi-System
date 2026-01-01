// src/domain/ports/notification.port.ts

/**
 * Notification options
 */
export interface NotificationOptions {
  userId?: string;
  email?: string;
  phoneNumber?: string;
  templateName: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: Date;
}

/**
 * Notification port for sending notifications
 */
export abstract class NotificationPort {
  /**
   * Send a notification
   */
  abstract send(options: NotificationOptions): Promise<void>;

  /**
   * Send bulk notifications
   */
  abstract sendBulk(options: NotificationOptions[]): Promise<void>;

  /**
   * Check if user can receive a specific notification type
   */
  abstract canReceive(userId: string, notificationType: string): Promise<boolean>;
}

/**
 * Injection token for NotificationPort
 */
export const NOTIFICATION_PORT = 'NOTIFICATION_PORT';
