import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditingService } from '../services/auditing.service';

@Injectable()
export class SecurityAnalysisTask {
  private readonly logger = new Logger(SecurityAnalysisTask.name);

  constructor(private readonly auditingService: AuditingService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySecurityAnalysis() {
    this.logger.log('Running hourly suspicious activity detection...');
    try {
      await this.auditingService.detectSuspiciousActivity();
    } catch (error: unknown) { // FIX IS HERE: Add type for error
      const message = error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error('Hourly security analysis failed.', message);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyLogCleanup() {
      const retentionDays = 365; // This should come from config
      this.logger.log(`Running daily log cleanup for logs older than ${retentionDays} days...`);
      const { deletedCount } = await this.auditingService.cleanupOldLogs(retentionDays);
      this.logger.log(`Successfully cleaned up ${deletedCount} old audit logs.`);
  }
}