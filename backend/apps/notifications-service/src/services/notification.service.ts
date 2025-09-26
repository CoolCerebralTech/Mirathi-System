import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { TemplateRepository } from '../repositories/template.repository';
import { EmailProvider } from '../providers/email.provider';
import { SmsProvider } from '../providers/sms.provider';
import { NotificationEntity } from '../entities/notification.entity';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';
import { NotificationChannel, NotificationStatus, EventType } from '@shamba/common';

export interface SendNotificationOptions {
  templateName: string;
  recipientId: string;
  channel: NotificationChannel;
  variables: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  notificationId: string;
  message?: string;
  error?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private templateRepository: TemplateRepository,
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async sendNotification(options: SendNotificationOptions): Promise<NotificationResult> {
    const startTime = Date.now();

    try {
      this.logger.info('Sending notification', 'NotificationService', {
        templateName: options.templateName,
        recipientId: options.recipientId,
        channel: options.channel,
      });

      // 1. Get the template
      const template = await this.templateRepository.findByName(options.templateName);
      if (!template) {
        throw new NotFoundException(`Template '${options.templateName}' not found`);
      }

      if (!template.isActive) {
        throw new Error(`Template '${options.templateName}' is not active`);
      }

      // 2. Validate template variables
      const variableValidation = template.validateVariables(options.variables);
      if (!variableValidation.isValid) {
        throw new Error(`Missing required variables: ${variableValidation.missing.join(', ')}`);
      }

      // 3. Compile template
      const compiled = template.compileTemplate(options.variables);

      // 4. Create notification record
      const notification = await this.notificationRepository.create({
        channel: options.channel,
        recipientId: options.recipientId,
        templateId: template.id,
        subject: compiled.subject,
        body: compiled.body,
        metadata: options.metadata,
      });

      // 5. Send via appropriate channel
      const sendResult = await this.sendViaChannel(notification, options.channel);

      if (sendResult.success) {
        // 6. Update notification status
        await this.notificationRepository.updateStatus(
          notification.id,
          NotificationStatus.SENT,
          { sentAt: new Date() }
        );

        // 7. Publish notification sent event
        await this.messagingService.publish(EventType.NOTIFICATION_SENT, {
          notificationId: notification.id,
          recipientId: options.recipientId,
          channel: options.channel,
          status: 'sent',
          template: options.templateName,
          timestamp: new Date(),
        });

        const duration = Date.now() - startTime;
        this.logger.info('Notification sent successfully', 'NotificationService', {
          notificationId: notification.id,
          duration,
        });

        return {
          success: true,
          notificationId: notification.id,
          message: 'Notification sent successfully',
        };
      } else {
        // Handle send failure
        await this.notificationRepository.updateStatus(
          notification.id,
          NotificationStatus.FAILED,
          { failReason: sendResult.error }
        );

        this.logger.error('Failed to send notification', 'NotificationService', {
          notificationId: notification.id,
          error: sendResult.error,
        });

        return {
          success: false,
          notificationId: notification.id,
          error: sendResult.error,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Notification sending failed', 'NotificationService', {
        templateName: options.templateName,
        recipientId: options.recipientId,
        error: error.message,
        duration,
      });

      return {
        success: false,
        notificationId: 'unknown', // Couldn't create notification record
        error: error.message,
      };
    }
  }

  private async sendViaChannel(
    notification: NotificationEntity,
    channel: NotificationChannel
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          return await this.sendEmail(notification);

        case NotificationChannel.SMS:
          return await this.sendSms(notification);

        default:
          return {
            success: false,
            error: `Unsupported notification channel: ${channel}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendEmail(notification: NotificationEntity): Promise<{ success: boolean; error?: string }> {
    // In a real implementation, you would get the recipient's email from the user service
    const recipientEmail = 'recipient@example.com'; // This would come from user data

    const result = await this.emailProvider.sendEmail({
      to: recipientEmail,
      subject: notification.subject!,
      html: notification.body,
    });

    return {
      success: result.success,
      error: result.error,
    };
  }

  private async sendSms(notification: NotificationEntity): Promise<{ success: boolean; error?: string }> {
    // In a real implementation, you would get the recipient's phone number from the user service
    const recipientPhone = '+254700000000'; // This would come from user data

    // Validate phone number
    if (!this.smsProvider.validatePhoneNumber(recipientPhone)) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    }

    const formattedPhone = this.smsProvider.formatPhoneNumber(recipientPhone);
    const result = await this.smsProvider.sendSms({
      to: formattedPhone,
      message: this.stripHtml(notification.body),
    });

    return {
      success: result.success,
      error: result.error,
    };
  }

  private stripHtml(html: string): string {
    // Simple HTML to text conversion for SMS
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim()
      .substring(0, 160); // SMS length limit
  }

  async retryFailedNotifications(limit: number = 50): Promise<{ success: number; failed: number }> {
    this.logger.info('Retrying failed notifications', 'NotificationService');

    const failedNotifications = await this.notificationRepository.getFailedNotifications(limit);
    let successCount = 0;
    let failedCount = 0;

    for (const notification of failedNotifications) {
      try {
        notification.prepareForRetry();
        
        const result = await this.sendViaChannel(notification, notification.channel);

        if (result.success) {
          await this.notificationRepository.updateStatus(
            notification.id,
            NotificationStatus.SENT,
            { sentAt: new Date() }
          );
          successCount++;
        } else {
          await this.notificationRepository.updateStatus(
            notification.id,
            NotificationStatus.FAILED,
            { failReason: result.error }
          );
          failedCount++;
        }
      } catch (error) {
        this.logger.error('Error retrying notification', 'NotificationService', {
          notificationId: notification.id,
          error: error.message,
        });
        failedCount++;
      }
    }

    this.logger.info('Failed notifications retry completed', 'NotificationService', {
      successCount,
      failedCount,
      total: failedNotifications.length,
    });

    return { success: successCount, failed: failedCount };
  }

  async processPendingNotifications(limit: number = 100): Promise<{ success: number; failed: number }> {
    this.logger.info('Processing pending notifications', 'NotificationService');

    const pendingNotifications = await this.notificationRepository.getPendingNotifications(limit);
    let successCount = 0;
    let failedCount = 0;

    for (const notification of pendingNotifications) {
      try {
        const result = await this.sendViaChannel(notification, notification.channel);

        if (result.success) {
          await this.notificationRepository.updateStatus(
            notification.id,
            NotificationStatus.SENT,
            { sentAt: new Date() }
          );
          successCount++;
        } else {
          await this.notificationRepository.updateStatus(
            notification.id,
            NotificationStatus.FAILED,
            { failReason: result.error }
          );
          failedCount++;
        }
      } catch (error) {
        this.logger.error('Error processing pending notification', 'NotificationService', {
          notificationId: notification.id,
          error: error.message,
        });
        failedCount++;
      }
    }

    this.logger.info('Pending notifications processing completed', 'NotificationService', {
      successCount,
      failedCount,
      total: pendingNotifications.length,
    });

    return { success: successCount, failed: failedCount };
  }

  async getNotificationStatus(notificationId: string): Promise<{
    status: NotificationStatus;
    sentAt?: Date;
    failReason?: string;
    retryCount: number;
  }> {
    const notification = await this.notificationRepository.findById(notificationId);

    return {
      status: notification.status,
      sentAt: notification.sentAt,
      failReason: notification.failReason,
      retryCount: notification.retryCount,
    };
  }

  async getServiceHealth(): Promise<{
    email: { status: string; connected: boolean };
    sms: { status: string; connected: boolean };
    queue: { pending: number; failed: number };
  }> {
    const emailStatus = this.emailProvider.getProviderInfo();
    const smsStatus = this.smsProvider.getProviderInfo();

    const stats = await this.notificationRepository.getStats('day');

    return {
      email: {
        status: emailStatus.status,
        connected: emailStatus.status === 'connected',
      },
      sms: {
        status: smsStatus.status,
        connected: smsStatus.status === 'connected',
      },
      queue: {
        pending: stats.pending,
        failed: stats.failed,
      },
    };
  }
}