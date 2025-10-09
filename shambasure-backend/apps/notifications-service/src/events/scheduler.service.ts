// ============================================================================
// scheduler.service.ts - Scheduled Tasks for Notification Processing
// ============================================================================

import { Injectable as SchedulerInjectable, Logger as SchedulerLogger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService as SchedulerNotificationsService } from '../services/notifications.service';

/**
 * SchedulerService - Cron jobs for notification processing
 *
 * SCHEDULED TASKS:
 * - Process pending notifications (every minute)
 * - Retry failed notifications (every 30 minutes)
 * - Cleanup old notifications (daily at midnight)
 */
@SchedulerInjectable()
export class SchedulerService {
  private readonly logger = new SchedulerLogger(SchedulerService.name);

  constructor(private readonly notificationsService: SchedulerNotificationsService) {}

  /**
   * Process pending notifications every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPending(): Promise<void> {
    this.logger.debug('Running: Process pending notifications');

    try {
      const result = await this.notificationsService.processPendingNotifications(100);

      if (result.success > 0 || result.failed > 0) {
        this.logger.log(`Processed notifications: ${result.success} sent, ${result.failed} failed`);
      }
    } catch (error) {
      this.logger.error('Failed to process pending notifications', error);
    }
  }

  /**
   * Retry failed notifications every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async retryFailed(): Promise<void> {
    this.logger.debug('Running: Retry failed notifications');

    try {
      const result = await this.notificationsService.retryFailedNotifications(50);

      if (result.success > 0 || result.failed > 0) {
        this.logger.log(
          `Retried notifications: ${result.success} recovered, ${result.failed} still failed`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to retry notifications', error);
    }
  }

  /**
   * Cleanup old notifications daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOld(): Promise<void> {
    this.logger.log('Running: Cleanup old notifications');

    try {
      const count = await this.notificationsService.cleanupOldNotifications(90);
      this.logger.log(`Cleaned up ${count} old notifications`);
    } catch (error) {
      this.logger.error('Failed to cleanup old notifications', error);
    }
  }
}
