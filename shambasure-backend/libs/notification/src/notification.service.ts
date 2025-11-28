import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationService,
  EmailNotification,
  SMSNotification,
} from './interfaces/notification.interface';

/**
 * NotificationService
 *
 * This is the concrete implementation of the INotificationService.
 * In this initial version, it acts as a "Logging" or "Dummy" service. Its job
 * is to satisfy the dependency injection contract and log the actions it would take.
 *
 * LATER, this service will be updated to inject the RabbitMQ ClientProxy from
 * the @shamba/messaging library and will publish events to the notifications-service.
 */
@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor() {
    this.logger.log('NotificationService initialized (Logging Mode)');
  }

  /**
   * Pretends to send an email by logging the payload.
   * In the future, this will publish an `email.send` event to RabbitMQ.
   */
  async sendEmail(notification: EmailNotification): Promise<void> {
    this.logger.log(`[LOG-ONLY] Publishing 'sendEmail' event for: ${notification.to}`);
    this.logger.debug(JSON.stringify(notification));
    // In the real implementation, this would look like:
    // this.client.emit('notification.email.send', notification);
    return Promise.resolve();
  }

  /**
   * Pretends to send an SMS by logging the payload.
   * In the future, this will publish an `sms.send` event to RabbitMQ.
   */
  async sendSMS(notification: SMSNotification): Promise<void> {
    this.logger.log(`[LOG-ONLY] Publishing 'sendSms' event for: ${notification.to}`);
    this.logger.debug(JSON.stringify(notification));
    // In the real implementation, this would look like:
    // this.client.emit('notification.sms.send', notification);
    return Promise.resolve();
  }

  /**
   * Lightweight health check method.
   * Currently acts as a no-op that always resolves successfully.
   * In a future version, this can verify connectivity with RabbitMQ or
   * other underlying messaging infrastructure.
   */
  async healthCheck(): Promise<void> {
    this.logger.verbose('NotificationService health check passed (Logging Mode)');
    return Promise.resolve();
  }
}
