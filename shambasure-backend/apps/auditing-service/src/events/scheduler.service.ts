/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// ============================================================================
// scheduler.service.ts - Scheduled Tasks
// ============================================================================

import { Injectable as SchedulerInjectable, Logger as SchedulerLogger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditingService as SchedulerAuditingService } from '../services/auditing.service';

/**
 * SchedulerService - Cron jobs for auditing tasks
 */
@SchedulerInjectable()
export class SchedulerService {
  private readonly logger = new SchedulerLogger(SchedulerService.name);

  constructor(private readonly auditingService: SchedulerAuditingService) {}

  /**
   * Cleanup old audit logs daily at 2 AM
   */
  @Cron('0 2 * * *')
  async cleanupOldLogs(): Promise<void> {
    this.logger.log('Running: Cleanup old audit logs');

    try {
      const retentionDays = 365; // Keep 1 year of logs
      const result = await this.auditingService.cleanupOldLogs(retentionDays);

      this.logger.log(`Cleaned up ${result.deletedCount} old audit logs`);
    } catch (error) {
      this.logger.error('Failed to cleanup old logs', error);
    }
  }

  /**
   * Detect suspicious activity every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async detectSuspiciousActivity(): Promise<void> {
    this.logger.debug('Running: Suspicious activity detection');

    try {
      const suspicious = await this.auditingService.detectSuspiciousActivity();

      if (suspicious.length > 0) {
        this.logger.warn(`Found ${suspicious.length} users with suspicious activity`, suspicious);
      }
    } catch (error) {
      this.logger.error('Failed to detect suspicious activity', error);
    }
  }
}
