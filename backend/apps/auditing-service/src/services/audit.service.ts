import { Injectable, BadRequestException } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { SecurityEventRepository } from '../repositories/security-event.repository';
import { AuditLogEntity, AuditSummaryEntity, SecurityEventEntity } from '../entities/audit-log.entity';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';
import { 
  AuditAction, 
  AuditResource, 
  AuditSeverity,
  AuditQueryDto,
  EventType 
} from '@shamba/common';

@Injectable()
export class AuditService {
  constructor(
    private auditLogRepository: AuditLogRepository,
    private securityEventRepository: SecurityEventRepository,
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async logEvent(auditData: {
    action: AuditAction;
    resource: AuditResource;
    resourceId: string;
    userId: string;
    userIp: string;
    userAgent: string;
    severity: AuditSeverity;
    details: Record<string, any>;
    metadata?: Record<string, any>;
    correlationId: string;
    service: string;
    status: 'success' | 'failure';
    duration?: number;
    errorMessage?: string;
    stackTrace?: string;
  }): Promise<AuditLogEntity> {
    this.logger.debug('Logging audit event', 'AuditService', {
      action: auditData.action,
      resource: auditData.resource,
      userId: auditData.userId,
    });

    // Validate audit data
    const validation = this.validateAuditData(auditData);
    if (!validation.isValid) {
      throw new BadRequestException(`Invalid audit data: ${validation.errors.join(', ')}`);
    }

    // Sanitize sensitive data
    const sanitizedDetails = this.sanitizeSensitiveData(auditData.details);
    const sanitizedMetadata = this.sanitizeSensitiveData(auditData.metadata || {});

    const auditLog = await this.auditLogRepository.create({
      ...auditData,
      details: sanitizedDetails,
      metadata: sanitizedMetadata,
    });

    // Check if this event should trigger a security alert
    if (auditLog.shouldBeAlerted()) {
      await this.checkForSecurityEvent(auditLog);
    }

    // Publish audit event for other services
    await this.messagingService.publish('audit.event_logged', {
      auditLogId: auditLog.id,
      action: auditLog.action,
      resource: auditLog.resource,
      userId: auditLog.userId,
      severity: auditLog.severity,
      timestamp: auditLog.timestamp,
    });

    this.logger.debug('Audit event logged successfully', 'AuditService', {
      auditLogId: auditLog.id,
    });

    return auditLog;
  }

  async getAuditLogs(query: AuditQueryDto): Promise<{
    logs: AuditLogEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.debug('Fetching audit logs', 'AuditService', { query });

    const result = await this.auditLogRepository.findAll(query);

    // Log the access to audit logs for security
    await this.logEvent({
      action: AuditAction.READ,
      resource: AuditResource.AUDIT_LOG,
      resourceId: 'multiple',
      userId: 'system', // This would be the actual user ID in a real scenario
      userIp: 'system',
      userAgent: 'auditing-service',
      severity: AuditSeverity.LOW,
      details: { query },
      correlationId: `audit-query-${Date.now()}`,
      service: 'auditing-service',
      status: 'success',
    });

    return result;
  }

  async getAuditLogById(id: string): Promise<AuditLogEntity> {
    this.logger.debug('Fetching audit log by ID', 'AuditService', { id });

    const auditLog = await this.auditLogRepository.findById(id);

    // Log the access to specific audit log
    await this.logEvent({
      action: AuditAction.READ,
      resource: AuditResource.AUDIT_LOG,
      resourceId: id,
      userId: 'system', // This would be the actual user ID in a real scenario
      userIp: 'system',
      userAgent: 'auditing-service',
      severity: AuditSeverity.LOW,
      details: { auditLogId: id },
      correlationId: `audit-read-${Date.now()}`,
      service: 'auditing-service',
      status: 'success',
    });

    return auditLog;
  }

  async getAuditSummary(startDate: Date, endDate: Date): Promise<AuditSummaryEntity> {
    this.logger.debug('Generating audit summary', 'AuditService', { startDate, endDate });

    const summary = await this.auditLogRepository.getSummary(startDate, endDate);

    // Log the summary generation
    await this.logEvent({
      action: AuditAction.REPORT_GENERATED,
      resource: AuditResource.AUDIT_LOG,
      resourceId: 'summary',
      userId: 'system',
      userIp: 'system',
      userAgent: 'auditing-service',
      severity: AuditSeverity.LOW,
      details: { startDate, endDate, summary: summary.getSummary() },
      correlationId: `audit-summary-${Date.now()}`,
      service: 'auditing-service',
      status: 'success',
    });

    return summary;
  }

  async getUserActivity(userId: string, days: number = 30): Promise<any> {
    this.logger.debug('Getting user activity', 'AuditService', { userId, days });

    const activity = await this.auditLogRepository.getUserActivity(userId, days);

    // Log the user activity query
    await this.logEvent({
      action: AuditAction.READ,
      resource: AuditResource.USER_ACTIVITY,
      resourceId: userId,
      userId: 'system', // This would be the actual user ID in a real scenario
      userIp: 'system',
      userAgent: 'auditing-service',
      severity: AuditSeverity.LOW,
      details: { userId, days },
      correlationId: `user-activity-${Date.now()}`,
      service: 'auditing-service',
      status: 'success',
    });

    return activity;
  }

  async getServiceStats(service: string, days: number = 7): Promise<any> {
    this.logger.debug('Getting service stats', 'AuditService', { service, days });

    const stats = await this.auditLogRepository.getServiceStats(service, days);

    return stats;
  }

  async detectSuspiciousActivity(days: number = 1): Promise<AuditLogEntity[]> {
    this.logger.debug('Detecting suspicious activity', 'AuditService', { days });

    const suspiciousLogs = await this.auditLogRepository.findSuspiciousActivity(days);

    if (suspiciousLogs.length > 0) {
      this.logger.warn('Suspicious activity detected', 'AuditService', {
        count: suspiciousLogs.length,
        days,
      });

      // Create security event for investigation
      await this.securityEventRepository.create({
        type: 'suspicious_login',
        severity: 'medium',
        description: `Detected ${suspiciousLogs.length} suspicious activities in the last ${days} day(s)`,
        affectedUsers: [...new Set(suspiciousLogs.map(log => log.userId))],
        relatedLogs: suspiciousLogs.map(log => log.id),
        investigationNotes: 'Automatically detected by suspicious activity scanner',
      });
    }

    return suspiciousLogs;
  }

  async cleanupOldLogs(retentionDays: number = 365): Promise<{ deletedCount: number }> {
    this.logger.info('Cleaning up old audit logs', 'AuditService', { retentionDays });

    const result = await this.auditLogRepository.cleanupOldLogs(retentionDays);

    // Log the cleanup operation
    await this.logEvent({
      action: AuditAction.DELETE,
      resource: AuditResource.AUDIT_LOG,
      resourceId: 'multiple',
      userId: 'system',
      userIp: 'system',
      userAgent: 'auditing-service',
      severity: AuditSeverity.LOW,
      details: { retentionDays, deletedCount: result.deletedCount },
      correlationId: `audit-cleanup-${Date.now()}`,
      service: 'auditing-service',
      status: 'success',
    });

    this.logger.info('Old audit logs cleaned up', 'AuditService', {
      deletedCount: result.deletedCount,
    });

    return result;
  }

  async exportAuditLogs(startDate: Date, endDate: Date): Promise<AuditLogEntity[]> {
    this.logger.info('Exporting audit logs', 'AuditService', { startDate, endDate });

    const logs = await this.auditLogRepository.exportLogs(startDate, endDate);

    // Log the export operation
    await this.logEvent({
      action: AuditAction.EXPORT,
      resource: AuditResource.AUDIT_LOG,
      resourceId: 'export',
      userId: 'system', // This would be the actual user ID in a real scenario
      userIp: 'system',
      userAgent: 'auditing-service',
      severity: AuditSeverity.MEDIUM,
      details: { 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        recordCount: logs.length,
      },
      correlationId: `audit-export-${Date.now()}`,
      service: 'auditing-service',
      status: 'success',
    });

    return logs;
  }

  // Security Events Management
  async getSecurityEvents(): Promise<SecurityEventEntity[]> {
    return this.securityEventRepository.findAllOpenEvents();
  }

  async updateSecurityEventStatus(
    eventId: string, 
    status: 'open' | 'investigating' | 'resolved' | 'false_positive', 
    resolution?: string
  ): Promise<SecurityEventEntity> {
    this.logger.info('Updating security event status', 'AuditService', { eventId, status });

    const event = await this.securityEventRepository.updateStatus(eventId, status, resolution);

    // Log the status update
    await this.logEvent({
      action: AuditAction.UPDATE,
      resource: AuditResource.SECURITY_EVENT,
      resourceId: eventId,
      userId: 'system', // This would be the actual user ID in a real scenario
      userIp: 'system',
      userAgent: 'auditing-service',
      severity: AuditSeverity.MEDIUM,
      details: { eventId, status, resolution },
      correlationId: `security-event-update-${Date.now()}`,
      service: 'auditing-service',
      status: 'success',
    });

    return event;
  }

  async addSecurityEventNotes(eventId: string, notes: string): Promise<SecurityEventEntity> {
    this.logger.debug('Adding security event notes', 'AuditService', { eventId });

    const event = await this.securityEventRepository.addInvestigationNotes(eventId, notes);

    return event;
  }

  async getSecurityStatistics(days: number = 30): Promise<any> {
    return this.securityEventRepository.getStatistics(days);
  }

  private validateAuditData(auditData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!auditData.action) {
      errors.push('Action is required');
    }

    if (!auditData.resource) {
      errors.push('Resource is required');
    }

    if (!auditData.resourceId) {
      errors.push('Resource ID is required');
    }

    if (!auditData.userId) {
      errors.push('User ID is required');
    }

    if (!auditData.correlationId) {
      errors.push('Correlation ID is required');
    }

    if (!auditData.service) {
      errors.push('Service is required');
    }

    if (!auditData.status) {
      errors.push('Status is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private sanitizeSensitiveData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization', 
      'accessToken', 'refreshToken', 'apiKey', 'privateKey'
    ];

    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeSensitiveData(sanitized[key]);
      }
    }

    return sanitized;
  }

  private async checkForSecurityEvent(auditLog: AuditLogEntity): Promise<void> {
    // Check for multiple failed logins from the same IP
    if (auditLog.action === AuditAction.USER_LOGIN_FAILED) {
      const failedLogins = await this.auditLogRepository.findAll({
        page: 1,
        limit: 10,
        action: AuditAction.USER_LOGIN_FAILED,
        userIp: auditLog.userIp,
        startDate: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
      } as any);

      if (failedLogins.total >= 5) {
        await this.securityEventRepository.create({
          type: 'multiple_failures',
          severity: 'high',
          description: `Multiple failed login attempts from IP ${auditLog.userIp}`,
          affectedUsers: [...new Set(failedLogins.logs.map(log => log.userId))],
          relatedLogs: failedLogins.logs.map(log => log.id),
          investigationNotes: 'Automatically detected by failed login threshold',
        });
      }
    }

    // Check for unauthorized access attempts
    if (auditLog.action === AuditAction.ACCESS_DENIED && auditLog.severity === AuditSeverity.HIGH) {
      await this.securityEventRepository.create({
        type: 'unauthorized_access',
        severity: 'high',
        description: `Unauthorized access attempt by user ${auditLog.userId}`,
        affectedUsers: [auditLog.userId],
        relatedLogs: [auditLog.id],
        investigationNotes: 'Automatically detected by access denial',
      });
    }
  }
}