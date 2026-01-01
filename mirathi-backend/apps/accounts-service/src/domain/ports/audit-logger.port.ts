// src/domain/ports/audit-logger.port.ts

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  action: string;
  actorId?: string;
  actorType?: string;
  resourceId?: string;
  resourceType?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit logger port for audit trail
 */
export abstract class AuditLoggerPort {
  /**
   * Log an audit entry
   */
  abstract log(entry: AuditLogEntry): Promise<void>;

  /**
   * Get audit logs for a resource
   */
  abstract getLogs(
    resourceId: string,
    options?: {
      from?: Date;
      to?: Date;
      action?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<AuditLogEntry[]>;

  /**
   * Get audit logs for an actor
   */
  abstract getActorLogs(
    actorId: string,
    options?: {
      from?: Date;
      to?: Date;
      action?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<AuditLogEntry[]>;
}

/**
 * Injection token for AuditLoggerPort
 */
export const AUDIT_LOGGER_PORT = 'AUDIT_LOGGER_PORT';
