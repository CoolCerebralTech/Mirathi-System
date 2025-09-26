import { AuditAction, AuditResource, AuditSeverity } from '@shamba/common';
import { Exclude } from 'class-transformer';

export class AuditLogEntity {
  id: string;
  timestamp: Date;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  userId: string;
  userIp: string;
  userAgent: string;
  severity: AuditSeverity;
  details: Record<string, any>;
  metadata: Record<string, any>;
  correlationId: string;
  service: string;
  status: 'success' | 'failure';
  duration?: number;
  errorMessage?: string;
  stackTrace?: string;

  // Relations
  user?: any;

  constructor(partial: Partial<AuditLogEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  isHighSeverity(): boolean {
    return this.severity === AuditSeverity.HIGH;
  }

  isSecurityEvent(): boolean {
    const securityActions = [
      AuditAction.USER_LOGIN,
      AuditAction.USER_LOGOUT,
      AuditAction.USER_PASSWORD_CHANGE,
      AuditAction.USER_PERMISSION_CHANGE,
      AuditAction.ACCESS_DENIED,
    ];
    return securityActions.includes(this.action);
  }

  isDataModification(): boolean {
    const modificationActions = [
      AuditAction.CREATE,
      AuditAction.UPDATE,
      AuditAction.DELETE,
      AuditAction.APPROVE,
      AuditAction.REJECT,
    ];
    return modificationActions.includes(this.action);
  }

  getSummary(): string {
    return `${this.action} on ${this.resource} ${this.resourceId} by ${this.userId}`;
  }

  containsSensitiveData(): boolean {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const detailsStr = JSON.stringify(this.details).toLowerCase();
    return sensitiveFields.some(field => detailsStr.includes(field));
  }

  shouldBeAlerted(): boolean {
    return this.isHighSeverity() || 
           this.status === 'failure' || 
           this.isSecurityEvent() && this.status === 'failure';
  }

  // Validation methods
  isValid(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.action) {
      errors.push('Action is required');
    }

    if (!this.resource) {
      errors.push('Resource is required');
    }

    if (!this.resourceId) {
      errors.push('Resource ID is required');
    }

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (!this.correlationId) {
      errors.push('Correlation ID is required');
    }

    if (!this.service) {
      errors.push('Service is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export class AuditSummaryEntity {
  date: Date;
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByResource: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByStatus: Record<string, number>;
  uniqueUsers: number;
  averageDuration: number;
  failureRate: number;

  constructor(partial: Partial<AuditSummaryEntity>) {
    Object.assign(this, partial);
  }

  getHighSeverityCount(): number {
    return this.eventsBySeverity['HIGH'] || 0;
  }

  getFailureCount(): number {
    return this.eventsByStatus['failure'] || 0;
  }

  getSuccessRate(): number {
    if (this.totalEvents === 0) return 100;
    return ((this.totalEvents - this.getFailureCount()) / this.totalEvents) * 100;
  }
}

export class SecurityEventEntity {
  id: string;
  type: 'suspicious_login' | 'multiple_failures' | 'data_breach_attempt' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  affectedUsers: string[];
  relatedLogs: string[];
  investigationNotes?: string;
  resolution?: string;

  constructor(partial: Partial<SecurityEventEntity>) {
    Object.assign(this, partial);
  }

  isOpen(): boolean {
    return this.status === 'open' || this.status === 'investigating';
  }

  requiresImmediateAction(): boolean {
    return this.severity === 'critical' || 
           (this.severity === 'high' && this.isOpen());
  }

  getDuration(): number | null {
    if (!this.resolvedAt) return null;
    return this.resolvedAt.getTime() - this.detectedAt.getTime();
  }
}