import { Injectable } from '@nestjs/common';
import { createObjectCsvWriter } from 'csv-writer';
import { Archiver } from 'archiver';
import { Response } from 'express';
import { AuditService } from '../services/audit.service';
import { LoggerService } from '@shamba/observability';

@Injectable()
export class AuditReportService {
  constructor(
    private auditService: AuditService,
    private logger: LoggerService,
  ) {}

  async generateCSVReport(startDate: Date, endDate: Date): Promise<string> {
    this.logger.info('Generating CSV audit report', 'AuditReportService', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const logs = await this.auditService.exportAuditLogs(startDate, endDate);

    const csvWriter = createObjectCsvWriter({
      path: `/tmp/audit-report-${Date.now()}.csv`,
      header: [
        { id: 'timestamp', title: 'TIMESTAMP' },
        { id: 'action', title: 'ACTION' },
        { id: 'resource', title: 'RESOURCE' },
        { id: 'resourceId', title: 'RESOURCE_ID' },
        { id: 'userId', title: 'USER_ID' },
        { id: 'userIp', title: 'USER_IP' },
        { id: 'severity', title: 'SEVERITY' },
        { id: 'status', title: 'STATUS' },
        { id: 'service', title: 'SERVICE' },
        { id: 'correlationId', title: 'CORRELATION_ID' },
        { id: 'duration', title: 'DURATION_MS' },
      ],
    });

    const records = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      userId: log.userId,
      userIp: log.userIp,
      severity: log.severity,
      status: log.status,
      service: log.service,
      correlationId: log.correlationId,
      duration: log.duration || '',
    }));

    await csvWriter.writeRecords(records);

    return csvWriter.path;
  }

  async generateDetailedReport(startDate: Date, endDate: Date): Promise<any> {
    this.logger.info('Generating detailed audit report', 'AuditReportService', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const [summary, logs, securityStats] = await Promise.all([
      this.auditService.getAuditSummary(startDate, endDate),
      this.auditService.exportAuditLogs(startDate, endDate),
      this.auditService.getSecurityStatistics(
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      ),
    ]);

    // Analyze trends
    const trends = this.analyzeTrends(logs);

    return {
      report: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        },
        summary: {
          totalEvents: summary.totalEvents,
          uniqueUsers: summary.uniqueUsers,
          failureRate: summary.failureRate,
          averageDuration: summary.averageDuration,
        },
        breakdown: {
          byAction: summary.eventsByAction,
          byResource: summary.eventsByResource,
          bySeverity: summary.eventsBySeverity,
          byStatus: summary.eventsByStatus,
        },
        security: securityStats,
        trends,
        recommendations: this.generateReportRecommendations(summary, securityStats, trends),
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        recordCount: logs.length,
        reportVersion: '1.0',
      },
    };
  }

  async streamReportArchive(startDate: Date, endDate: Date, res: Response): Promise<void> {
    this.logger.info('Streaming audit report archive', 'AuditReportService');

    const archive = Archiver('zip', {
      zlib: { level: 9 },
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="audit-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.zip"`);

    // Pipe archive to response
    archive.pipe(res);

    // Add CSV report
    const csvPath = await this.generateCSVReport(startDate, endDate);
    archive.file(csvPath, { name: 'audit-logs.csv' });

    // Add JSON summary
    const detailedReport = await this.generateDetailedReport(startDate, endDate);
    archive.append(JSON.stringify(detailedReport, null, 2), { name: 'audit-summary.json' });

    // Finalize archive
    await archive.finalize();

    this.logger.info('Audit report archive streamed successfully', 'AuditReportService');
  }

  private analyzeTrends(logs: any[]): any {
    if (logs.length === 0) {
      return { message: 'Insufficient data for trend analysis' };
    }

    // Group logs by day
    const logsByDay: Record<string, any[]> = {};
    logs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!logsByDay[date]) {
        logsByDay[date] = [];
      }
      logsByDay[date].push(log);
    });

    // Calculate daily metrics
    const dailyMetrics = Object.entries(logsByDay).map(([date, dayLogs]) => {
      const failures = dayLogs.filter(log => log.status === 'failure').length;
      const highSeverity = dayLogs.filter(log => log.severity === 'HIGH').length;
      const totalDuration = dayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
      const durationCount = dayLogs.filter(log => log.duration).length;

      return {
        date,
        totalEvents: dayLogs.length,
        failureRate: (failures / dayLogs.length) * 100,
        highSeverityEvents: highSeverity,
        averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      };
    });

    // Calculate trends
    if (dailyMetrics.length < 2) {
      return { message: 'Insufficient days for trend analysis' };
    }

    const firstDay = dailyMetrics[0];
    const lastDay = dailyMetrics[dailyMetrics.length - 1];

    const trends = {
      totalEvents: this.calculateTrend(firstDay.totalEvents, lastDay.totalEvents),
      failureRate: this.calculateTrend(firstDay.failureRate, lastDay.failureRate),
      highSeverityEvents: this.calculateTrend(firstDay.highSeverityEvents, lastDay.highSeverityEvents),
      averageDuration: this.calculateTrend(firstDay.averageDuration, lastDay.averageDuration),
    };

    return {
      dailyMetrics,
      trends,
      analysisPeriod: `${dailyMetrics.length} days`,
    };
  }

  private calculateTrend(start: number, end: number): { direction: 'up' | 'down' | 'stable'; percentage: number } {
    if (start === 0) {
      return { direction: 'stable', percentage: 0 };
    }

    const percentage = ((end - start) / start) * 100;
    
    if (Math.abs(percentage) < 5) {
      return { direction: 'stable', percentage };
    } else if (percentage > 0) {
      return { direction: 'up', percentage };
    } else {
      return { direction: 'down', percentage };
    }
  }

  private generateReportRecommendations(summary: any, securityStats: any, trends: any): string[] {
    const recommendations: string[] = [];

    // Based on failure rate
    if (summary.failureRate > 10) {
      recommendations.push('High failure rate detected. Investigate system stability and user training.');
    }

    // Based on security events
    if (securityStats.openEvents > 0) {
      recommendations.push(`There are ${securityStats.openEvents} open security events requiring attention.`);
    }

    // Based on trends
    if (trends.trends && trends.trends.failureRate.direction === 'up') {
      recommendations.push('Failure rate is increasing. Monitor system health closely.');
    }

    if (trends.trends && trends.trends.highSeverityEvents.direction === 'up') {
      recommendations.push('High severity events are increasing. Review security measures.');
    }

    // General recommendations
    if (summary.totalEvents === 0) {
      recommendations.push('No audit events recorded in this period. Verify auditing is functioning correctly.');
    } else {
      recommendations.push('System appears to be functioning within normal parameters.');
    }

    return recommendations;
  }
}