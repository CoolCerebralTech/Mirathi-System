/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ============================================================================
// auditing.service.ts - Audit Logging & Analytics
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { AuditLog } from '@shamba/database';
import { AuditQueryDto, ShambaEvent, SortOrder } from '@shamba/common';
import { AuditingRepository } from '../repositories/auditing.repository';
import { AuditSummaryEntity } from '../entities/audit.entity';

/**
 * AuditingService - Audit logging and analytics
 *
 * RESPONSIBILITIES:
 * - Create audit logs from events
 * - Query audit logs
 * - Generate analytics reports
 * - Export data (CSV, JSON)
 * - Data retention cleanup
 */
@Injectable()
export class AuditingService {
  private readonly logger = new Logger(AuditingService.name);

  constructor(private readonly auditingRepository: AuditingRepository) {}

  // ========================================================================
  // EVENT PROCESSING
  // ========================================================================

  /**
   * Create audit log from domain event
   * Extracts actor ID from various event types
   */
  async createLogFromEvent(event: ShambaEvent): Promise<AuditLog> {
    const actorId = this.extractActorId(event.data);

    const logData = {
      action: event.type,
      payload: event.data as any,
      timestamp: event.timestamp,
      actor: actorId ? { connect: { id: actorId } } : undefined,
    };

    const log = await this.auditingRepository.create(logData);

    this.logger.debug(`Audit log created: ${event.type} by ${actorId || 'system'}`);

    return log;
  }

  /**
   * Extract actor ID from event data
   * Different events use different field names
   */
  private extractActorId(data: unknown): string | null {
    if (typeof data !== 'object' || data === null) return null;

    const record = data as Record<string, unknown>;
    const keys = ['userId', 'uploaderId', 'testatorId', 'ownerId', 'actorId'] as const;

    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string') {
        return value;
      }
    }

    return null;
  }

  // ========================================================================
  // QUERY OPERATIONS
  // ========================================================================

  async findMany(query: AuditQueryDto): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = {};

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    if (query.userId) {
      where.actorId = query.userId;
    }

    if (query.startDate && query.endDate) {
      where.timestamp = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    return this.auditingRepository.findMany(where, query);
  }

  async findByActor(
    actorId: string,
    query: AuditQueryDto,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.auditingRepository.findByActor(actorId, query);
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.auditingRepository.findById(id);
  }

  // ========================================================================
  // ANALYTICS & REPORTING
  // ========================================================================

  /**
   * Get summary statistics for date range
   */
  async getSummary(startDate: Date, endDate: Date): Promise<AuditSummaryEntity> {
    const where = {
      timestamp: { gte: startDate, lte: endDate },
    };

    // Get all data in parallel
    const [totalEvents, eventsByAction, uniqueActorCount] = await Promise.all([
      this.auditingRepository.getTotalCount(where),
      this.auditingRepository.getEventCountByAction(where),
      this.auditingRepository.getUniqueActorCount(where),
    ]);

    // Transform to summary format
    const eventsByActionMap: Record<string, number> = {};
    eventsByAction.forEach((e) => {
      eventsByActionMap[e.action] = e._count.id;
    });

    return new AuditSummaryEntity({
      date: startDate.toISOString(),
      totalEvents,
      eventsByAction: eventsByActionMap,
      uniqueUsers: uniqueActorCount,
    });
  }

  /**
   * Get daily event trends
   */
  async getDailyTrends(startDate: Date, endDate: Date) {
    return this.auditingRepository.getEventsByDay(startDate, endDate);
  }

  /**
   * Get most active users
   */
  async getMostActiveUsers(limit: number = 10, startDate?: Date, endDate?: Date) {
    const where =
      startDate && endDate ? { timestamp: { gte: startDate, lte: endDate } } : undefined;

    return this.auditingRepository.getMostActiveUsers(limit, where);
  }

  /**
   * Get most common actions
   */
  async getMostCommonActions(limit: number = 10, startDate?: Date, endDate?: Date) {
    const where =
      startDate && endDate ? { timestamp: { gte: startDate, lte: endDate } } : undefined;

    return this.auditingRepository.getMostCommonActions(limit, where);
  }

  /**
   * Generate CSV report
   */
  async generateCsvReport(startDate: Date, endDate: Date): Promise<string> {
    const { logs } = await this.auditingRepository.findMany(
      { timestamp: { gte: startDate, lte: endDate } },
      {
        page: 1,
        limit: 10000,
        sortOrder: SortOrder.ASC,
      }, // Max 10k rows for CSV
    );

    // Generate CSV
    const headers = ['Timestamp', 'Action', 'Actor ID', 'Payload'];
    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.action,
      log.actorId || 'system',
      JSON.stringify(log.payload),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  // ========================================================================
  // SECURITY & COMPLIANCE
  // ========================================================================

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(): Promise<any[]> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get users with high activity in last hour
    const activeUsers = await this.auditingRepository.getMostActiveUsers(
      20,
      oneHourAgo,
      new Date(), // endDate
      { timestamp: { gte: oneHourAgo, lte: new Date() } }, // optional filter
    );

    // Flag users with more than 100 events in an hour
    const suspicious = activeUsers.filter((u) => u.eventCount > 100);

    if (suspicious.length > 0) {
      this.logger.warn(`Detected ${suspicious.length} users with suspicious activity`);
    }

    return suspicious;
  }

  /**
   * Search for specific event patterns
   */
  async searchEvents(action: string, startDate: Date, endDate: Date) {
    return this.auditingRepository.findByAction(action, {
      page: 1,
      limit: 100,
      startDate,
      endDate,
    } as any);
  }

  // ========================================================================
  // DATA RETENTION
  // ========================================================================

  /**
   * Cleanup old audit logs (data retention policy)
   */
  async cleanupOldLogs(retentionDays: number): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.auditingRepository.deleteOlderThan(cutoffDate);

    this.logger.log(`Cleaned up ${result.count} audit logs older than ${retentionDays} days`);

    return { deletedCount: result.count };
  }
}
