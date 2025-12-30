/**
 * Defines the injection token for the NotificationService.
 * Using a constant string token is a robust way to handle dependency injection
 * for interfaces across different libraries.
 */
export const INotificationService = 'INotificationService';

/**
 * Defines the data structure for sending an email notification.
 */
export interface EmailNotification {
  to: string;
  subject: string;
  template: string; // e.g., 'welcome-email', 'password-reset'
  data: Record<string, any>; // Contextual data for the email template
}

/**
 * Defines the data structure for sending an SMS notification.
 */
export interface SMSNotification {
  to: string; // Must be in E.164 format (e.g., +254712345678)
  message: string;
}

/**
 * INotificationService (Port)
 *
 * This is the public contract for sending notifications. Any service that needs
 * to send an email or SMS will depend on this interface, not on a concrete class.
 * This decouples the application services from the actual implementation details
 * of sending notifications.
 */
export interface INotificationService {
  /**
   * Sends an email notification.
   * This method will be implemented to push a job to the notifications-service.
   */
  sendEmail(notification: EmailNotification): Promise<void>;

  /**
   * Sends an SMS notification.
   * This method will be implemented to push a job to the notifications-service.
   */
  sendSMS(notification: SMSNotification): Promise<void>;
}
