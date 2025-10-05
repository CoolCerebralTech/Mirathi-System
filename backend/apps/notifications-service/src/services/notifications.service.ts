
// ============================================================================
// notifications.service.ts - Notification Management & Processing
// ============================================================================

import { 
  Inject as NotifyInject, 
  Injectable as NotifyInjectable, 
  Logger as NotifyLogger,
  NotFoundException as NotifyNotFoundException,
} from '@nestjs/common';
import { 
  Notification, 
  NotificationStatus, 
  NotificationChannel 
} from '@shamba/database';
import { NotificationQueryDto } from '@shamba/common';
import { 
  NOTIFICATION_PROVIDER, 
  NotificationProvider 
} from '../providers/provider.interface';
import { TemplatesService as NotifyTemplatesService } from './templates.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

/**
 * NotificationsService - Core notification management
 * 
 * RESPONSIBILITIES:
 * - Queue notifications for sending
 * - Process pending notifications
 * - Handle event-driven notification creation
 * - Integrate with email/SMS providers
 * - Retry failed notifications
 * - Query notification history
 * 
 * ARCHITECTURE:
 * Uses Dependency Inversion - providers injected via interface
 */
@NotifyInjectable()
export class NotificationsService {
  private readonly logger = new NotifyLogger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly templatesService: NotifyTemplatesService,
    @NotifyInject(`${NOTIFICATION_PROVIDER}_EMAIL`) 
    private readonly emailProvider: NotificationProvider,
    @NotifyInject(`${NOTIFICATION_PROVIDER}_SMS`) 
    private readonly smsProvider: NotificationProvider,
  ) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  /**
   * Create and queue notification for sending
   * Called by event handlers
   */
  async createAndQueueNotification(
    templateName: string, 
    recipientId: string, 
    variables: Record<string, any>
  ): Promise<Notification> {
    // Find template
    const template = await this.templatesService.findOne(templateName);

    // Create notification record
    const notification = await this.notificationsRepository.create({
      recipientId,
      templateId: template.id,
      channel: template.channel,
      status: NotificationStatus.PENDING,
    });

    this.logger.log(
      `Notification queued: ${notification.id} (${template.name} → user ${recipientId})`
    );

    return notification;
  }

  /**
   * Create multiple notifications at once
   */
  async createBatch(
    templateName: string,
    recipientIds: string[],
    variables: Record<string, any>
  ): Promise<number> {
    const template = await this.templatesService.findOne(templateName);

    const notifications = recipientIds.map(recipientId => ({
      recipientId,
      templateId: template.id,
      channel: template.channel,
      status: NotificationStatus.PENDING,
    }));

    const count = await this.notificationsRepository.createBatch(notifications);

    this.logger.log(
      `${count} notifications queued: ${template.name}`
    );

    return count;
  }

  // ========================================================================
  // PROCESSING
  // ========================================================================

  /**
   * Process pending notifications
   * Called by scheduled task (cron job)
   */
  async processPendingNotifications(
    limit = 100
  ): Promise<{ success: number; failed: number }> {
    const pending = await this.notificationsRepository.findPending(limit);

    this.logger.log(`Processing ${pending.length} pending notifications`);

    let success = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        await this.sendNotification(notification);
        success++;
      } catch (error) {
        this.logger.error(
          `Failed to send notification ${notification.id}`,
          error
        );
        failed++;
      }
    }

    this.logger.log(
      `Batch complete: ${success} sent, ${failed} failed`
    );

    return { success, failed };
  }

  /**
   * Send a single notification
   */
  private async sendNotification(notification: Notification): Promise<void> {
    // Get template
    const template = await this.templatesService.findOne(
      notification.templateId
    );

    // Compile template (variables stored in notification or fetched from context)
    const variables = {}; // TODO: Fetch from notification metadata or user service
    const { subject, body } = this.templatesService.compileTemplate(
      template, 
      variables
    );

    // Validate recipient
    if (!notification.recipientId) {
      await this.notificationsRepository.markAsFailed(
        notification.id,
        'Recipient ID is missing'
      );
      return;
    }

    // Get recipient contact info
    const recipientAddress = await this.getRecipientAddress(
      notification.recipientId,
      notification.channel
    );

    if (!recipientAddress) {
      await this.notificationsRepository.markAsFailed(
        notification.id,
        'Recipient contact information not found'
      );
      return;
    }

    // Select provider
    const provider = notification.channel === NotificationChannel.EMAIL
      ? this.emailProvider
      : this.smsProvider;

    // Send via provider
    const result = await provider.send({
      to: recipientAddress,
      subject: subject || undefined,
      body,
    });

    // Update status
    if (result.success) {
      await this.notificationsRepository.markAsSent(notification.id);
      this.logger.log(
        `Notification sent: ${notification.id} → ${recipientAddress}`
      );
    } else {
      await this.notificationsRepository.markAsFailed(
        notification.id,
        result.error || 'Unknown error'
      );
      this.logger.warn(
        `Notification failed: ${notification.id} - ${result.error}`
      );
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(limit = 50): Promise<{ success: number; failed: number }> {
    const failed = await this.notificationsRepository.findFailed(limit);

    this.logger.log(`Retrying ${failed.length} failed notifications`);

    let success = 0;
    let failedAgain = 0;

    for (const notification of failed) {
      // Reset to pending
      await this.notificationsRepository.update(notification.id, {
        status: NotificationStatus.PENDING,
        failReason: null,
      });

      try {
        await this.sendNotification(notification);
        success++;
      } catch (error) {
        failedAgain++;
      }
    }

    return { success, failed: failedAgain };
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  async findForUser(
    recipientId: string,
    query: NotificationQueryDto,
  ): Promise<{ notifications: Notification[]; total: number }> {
    return this.notificationsRepository.findByRecipient(recipientId, query);
  }

  async getStats(recipientId?: string) {
    if (recipientId) {
      const stats = await this.notificationsRepository.getStatsByRecipient(recipientId);
      return {
        byStatus: stats.map(s => ({
          status: s.status,
          channel: s.channel,
          count: s._count.id,
        })),
      };
    }

    const stats = await this.notificationsRepository.getGlobalStats();
    return {
      byStatus: stats.map(s => ({
        status: s.status,
        channel: s.channel,
        count: s._count.id,
      })),
    };
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  /**
   * Delete old notifications (data retention policy)
   */
  async cleanupOldNotifications(daysOld = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationsRepository.deleteOlderThan(cutoffDate);

    this.logger.log(`Cleaned up ${result.count} old notifications`);
    return result.count;
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Get recipient contact information
   * In production, this would call accounts-service
   */
  private async getRecipientAddress(
    recipientId: string,
    channel: NotificationChannel
  ): Promise<string | null> {
    // TODO: Make HTTP request to accounts-service or use event/cache
    // For now, return mock data
    if (channel === NotificationChannel.EMAIL) {
      return `user_${recipientId}@example.com`;
    }
    if (channel === NotificationChannel.SMS) {
      return `+254712345678`;
    }
    return null;
  }
}