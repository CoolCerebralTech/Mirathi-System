import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Notification, NotificationStatus } from '@shamba/database';
import { EventPattern, NotificationQueryDto, ShambaEvent } from '@shamba/common';
import { MessagingService } from '@shamba/messaging';
import { NOTIFICATION_PROVIDER, NotificationProvider } from '../providers/provider.interface';
import { TemplatesService } from './templates.service';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly templatesService: TemplatesService,
    private readonly messagingService: MessagingService,
    // --- DEPENDENCY INVERSION IN ACTION ---
    // We inject a provider for EMAIL and one for SMS using our abstract interface.
    // The actual implementation (SMTP, Twilio, etc.) is determined by the ProvidersModule.
    @Inject(`${NOTIFICATION_PROVIDER}_EMAIL`) private readonly emailProvider: NotificationProvider,
    @Inject(`${NOTIFICATION_PROVIDER}_SMS`) private readonly smsProvider: NotificationProvider,
  ) {}

  /**
   * The core method to create and queue a notification for sending.
   * This is called by our event handlers.
   */
  async createAndQueueNotification(templateName: string, recipientId: string, variables: Record<string, any>): Promise<Notification> {
    const template = await this.templatesService.findOne(templateName);
    if (!template) {
      throw new NotFoundException(`Template '${templateName}' not found.`);
    }

    const { subject, body } = this.templatesService.compileTemplate(template, variables);

    const notification = await this.notificationsRepository.create({
      recipientId,
      templateId: template.id,
      channel: template.channel,
      status: NotificationStatus.PENDING,
    });

    this.logger.log(`Notification ${notification.id} queued for sending.`);
    return notification;
  }
  
  /**
   * Processes a batch of pending notifications. This would be called by a scheduled task.
   */
  async processPendingNotifications(limit = 100): Promise<{ success: number; failed: number }> {
    const pending = await this.notificationsRepository.findPending(limit);
    let success = 0;
    let failed = 0;

    for (const notification of pending) {
        const template = await this.templatesService.findOne(notification.templateId);
        const { subject, body } = this.templatesService.compileTemplate(template, {});

        if (!notification.recipientId) {
            await this.markAsFailed(notification.id, 'Recipient ID is missing');
            failed++;
            continue;
        }

        const recipientAddress = await this.getRecipientAddress(notification.recipientId, notification.channel);

        const result = await provider.send({
            to: recipientAddress,
            subject: subject, // Use compiled subject
            body: body, // Use compiled body
        });

        await this.markAsFailed(notification.id, result.error || 'Unknown provider error');

        if (result.success) {
            await this.notificationsRepository.update(notification.id, {
                status: NotificationStatus.SENT,
                sentAt: new Date()
            });
            success++;
        } else {
            await this.markAsFailed(notification.id, result.error);
            failed++;
        }
    }
    return { success, failed };
  }
  
  private async markAsFailed(id: string, reason: string): Promise<void> {
      await this.notificationsRepository.update(id, {
          status: NotificationStatus.FAILED,
          failReason: reason
      });
  }

  /**
   * In a real system, this would make a cross-service call (e.g., via RabbitMQ or HTTP)
   * to the `accounts-service` to get the user's email or phone number.
   */
  private async getRecipientAddress(recipientId: string, channel: 'EMAIL' | 'SMS'): Promise<string | null> {
      // MOCK IMPLEMENTATION:
      if(channel === 'EMAIL') return `user_${recipientId}@example.com`;
      if(channel === 'SMS') return `+254712345678`;
      return null;
  }

  async findForUser(
  recipientId: string,
  query: NotificationQueryDto,
): Promise<{ notifications: Notification[]; total: number }> {
  return this.notificationsRepository.findMany({ recipientId }, query);
}
}