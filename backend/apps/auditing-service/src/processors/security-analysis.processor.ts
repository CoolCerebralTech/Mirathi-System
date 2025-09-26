import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from '../services/audit.service';
import { LoggerService } from '@shamba/observability';

@Injectable()
export class SecurityAnalysisProcessor implements OnModuleInit {
  constructor(
    private auditService: AuditService,
    private logger: LoggerService,
  ) {}

  async onModuleInit() {
    // Run initial security analysis on startup
    await this.runSecurityAnalysis();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async runScheduledSecurityAnalysis(): Promise<void> {
    this.logger.debug('Running scheduled security analysis', 'SecurityAnalysisProcessor');
    await this.runSecurityAnalysis();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailySecurityReport(): Promise<void> {
    this.logger.debug('Generating daily security report', 'SecurityAnalysisProcessor');
    await this.generateDailySecurityReport();
  }

  private async runSecurityAnalysis(): Promise<void> {
    try {
      // Detect suspicious activity from the last 24 hours
      const suspiciousActivities = await this.auditService.detectSuspiciousActivity(1);

      if (suspiciousActivities.length > 0) {
        this.logger.warn('Security analysis detected suspicious activities', 'SecurityAnalysisProcessor', {
          count: suspiciousActivities.length,
        });

        // Additional analysis could include:
        // - Geographic anomalies (logins from unusual locations)
        // - Time-based anomalies (activity at unusual hours)
        // - Behavioral anomalies (unusual patterns for specific users)
        // - Resource access patterns (unusual data access)
      } else {
        this.logger.debug('No suspicious activities detected', 'SecurityAnalysisProcessor');
      }
    } catch (error) {
      this.logger.error('Security analysis failed', 'SecurityAnalysisProcessor', {
        error: error.message,
      });
    }
  }

  private async generateDailySecurityReport(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get audit summary for yesterday
      const summary = await this.auditService.getAuditSummary(yesterday, today);

      // Get security statistics
      const securityStats = await this.auditService.getSecurityStatistics(1);

      // Generate report
      const report = {
        date: yesterday.toISOString().split('T')[0],
        summary: {
          totalEvents: summary.totalEvents,
          highSeverityEvents: summary.getHighSeverityCount(),
          failureRate: summary.failureRate,
          uniqueUsers: summary.uniqueUsers,
        },
        security: {
          openEvents: securityStats.openEvents,
          eventsBySeverity: securityStats.eventsBySeverity,
        },
        recommendations: this.generateRecommendations(summary, securityStats),
      };

      // Log the report generation
      await this.auditService.logEvent({
        action: 'REPORT_GENERATED',
        resource: 'SECURITY_REPORT',
        resourceId: `daily-${yesterday.toISOString().split('T')[0]}`,
        userId: 'system',
        userIp: 'system',
        userAgent: 'auditing-service',
        severity: 'LOW',
        details: report,
        correlationId: `daily-report-${Date.now()}`,
        service: 'auditing-service',
        status: 'success',
      });

      this.logger.info('Daily security report generated', 'SecurityAnalysisProcessor', {
        date: report.date,
        totalEvents: report.summary.totalEvents,
      });
    } catch (error) {
      this.logger.error('Failed to generate daily security report', 'SecurityAnalysisProcessor', {
        error: error.message,
      });
    }
  }

  private generateRecommendations(summary: any, securityStats: any): string[] {
    const recommendations: string[] = [];

    if (summary.failureRate > 5) {
      recommendations.push('High failure rate detected. Investigate system stability.');
    }

    if (summary.getHighSeverityCount() > 10) {
      recommendations.push('Multiple high-severity events detected. Review security measures.');
    }

    if (securityStats.openEvents > 5) {
      recommendations.push('Multiple open security events. Prioritize investigation.');
    }

    if (securityStats.eventsBySeverity.critical > 0) {
      recommendations.push('Critical security events detected. Immediate action required.');
    }

    if (recommendations.length === 0) {
      recommendations.push('No critical issues detected. System appears stable.');
    }

    return recommendations;
  }

  async analyzeUserBehavior(userId: string, days: number = 30): Promise<{
    riskScore: number;
    anomalies: string[];
    recommendations: string[];
  }> {
    const activity = await this.auditService.getUserActivity(userId, days);

    let riskScore = 0;
    const anomalies: string[] = [];
    const recommendations: string[] = [];

    // Analyze failure rate
    if (activity.failureRate > 20) {
      riskScore += 30;
      anomalies.push(`High failure rate: ${activity.failureRate.toFixed(1)}%`);
      recommendations.push('Review user training and system usability');
    }

    // Analyze activity patterns
    if (activity.averageDailyActions > 100) {
      riskScore += 20;
      anomalies.push(`Unusually high daily activity: ${activity.averageDailyActions.toFixed(1)} actions/day`);
      recommendations.push('Verify this level of activity is normal for this user');
    }

    // Analyze action types
    const sensitiveActions = ['DELETE', 'EXPORT', 'PERMISSION_CHANGE'];
    const sensitiveActionCount = sensitiveActions.reduce((count, action) => {
      return count + (activity.actionsByType[action] || 0);
    }, 0);

    if (sensitiveActionCount > 10) {
      riskScore += 25;
      anomalies.push(`High number of sensitive actions: ${sensitiveActionCount}`);
      recommendations.push('Review sensitive actions performed by this user');
    }

    // Analyze time patterns (simplified)
    if (activity.lastActivity) {
      const hoursSinceLastActivity = (Date.now() - activity.lastActivity.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastActivity > 24 * 30) { // 30 days
        riskScore -= 10; // Inactive users are lower risk
        anomalies.push('User has been inactive for more than 30 days');
        recommendations.push('Consider disabling inactive accounts');
      }
    }

    // Cap risk score at 100
    riskScore = Math.min(100, Math.max(0, riskScore));

    return {
      riskScore,
      anomalies,
      recommendations,
    };
  }
}