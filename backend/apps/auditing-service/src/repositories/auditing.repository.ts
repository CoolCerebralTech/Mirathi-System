
// ============================================================================
// auditing.repository.ts - Audit Log Data Access Layer
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService, AuditLog } from '@shamba/database';
import { PaginationQueryDto } from '@shamba/common';

/**
 * AuditingRepository - Pure data access for audit logs
 * 
 * RESPONSIBILITIES:
 * - Create immutable audit log entries
 * - Query audit logs with filters
 * - Aggregate statistics
 * - Cleanup old logs (data retention)
 * 
 * ARCHITECTURAL NOTE:
 * Audit logs are append-only. There are NO update or delete (by ID) operations.
 * Only bulk deletion for data retention policies.
 */
@Injectable()
export class AuditingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  async createBatch(data: Prisma.AuditLogCreateInput[]): Promise<number> {
    const result = await this.prisma.auditLog.createMany({ data });
    return result.count;
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  async findById(id: string): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  async findMany(
    where: Prisma.AuditLogWhereInput,
    pagination: PaginationQueryDto,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async findByActor(
    actorId: string,
    pagination: PaginationQueryDto,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.findMany({ actorId }, pagination);
  }

  async findByAction(
    action: string,
    pagination: PaginationQueryDto,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.findMany({ action }, pagination);
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    pagination: PaginationQueryDto,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.findMany({
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    }, pagination);
  }

  // ========================================================================
  // ANALYTICS & AGGREGATIONS
  // ========================================================================

  /**
   * Get event count by action type
   */
  async getEventCountByAction(where?: Prisma.AuditLogWhereInput) {
    return this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });
  }

  /**
   * Get unique actor count
   */
  async getUniqueActorCount(where?: Prisma.AuditLogWhereInput): Promise<number> {
    const result = await this.prisma.auditLog.findMany({
      where,
      select: { actorId: true },
      distinct: ['actorId'],
    });

    // Filter out null actorIds (system events)
    return result.filter(r => r.actorId !== null).length;
  }

  /**
   * Get total event count
   */
  async getTotalCount(where?: Prisma.AuditLogWhereInput): Promise<number> {
    return this.prisma.auditLog.count({ where });
  }

  /**
   * Get events grouped by day
   */
  async getEventsByDay(startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        timestamp: true,
        action: true,
      },
    });

    // Group by day in application layer (Prisma doesn't support DATE() grouping)
    const groupedByDay = logs.reduce((acc, log) => {
      const day = log.timestamp.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { date: day, count: 0, actions: {} };
      }
      acc[day].count++;
      acc[day].actions[log.action] = (acc[day].actions[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, { date: string; count: number; actions: Record<string, number> }>);

    return Object.values(groupedByDay);
  }

  /**
   * Get most active users
   */
  async getMostActiveUsers(
  limit: number = 10,
  arg2?: Date | Prisma.AuditLogWhereInput,
  arg3?: Date | Prisma.AuditLogWhereInput,
  arg4?: Prisma.AuditLogWhereInput,
): Promise<{ actorId: string; eventCount: number }[]> {
  // Normalize arguments into startDate, endDate, where
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let where: Prisma.AuditLogWhereInput | undefined;

  if (arg2 instanceof Date) {
    // Called as getMostActiveUsers(limit, startDate, ...)
    startDate = arg2;
    if (arg3 instanceof Date) {
      // Called as getMostActiveUsers(limit, startDate, endDate, maybeWhere)
      endDate = arg3;
      where = arg4;
    } else {
      // Called as getMostActiveUsers(limit, startDate, where)
      where = arg3 as Prisma.AuditLogWhereInput | undefined;
    }
  } else {
    // Called as getMostActiveUsers(limit, where)
    where = arg2 as Prisma.AuditLogWhereInput | undefined;
  }

  // Build date filter if dates provided
  const dateFilter: Prisma.AuditLogWhereInput | undefined =
    startDate && endDate
      ? { timestamp: { gte: startDate, lte: endDate } }
      : startDate
      ? { timestamp: { gte: startDate } }
      : undefined;

  // Merge filters (ensure actorId is not null)
  const finalWhere: Prisma.AuditLogWhereInput = {
    ...(where ?? {}),
    ...(dateFilter ?? {}),
    actorId: { not: null },
  };

  const results = await this.prisma.auditLog.groupBy({
    by: ['actorId'],
    where: finalWhere,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  return results.map(r => ({
    actorId: r.actorId!, // safe because we filtered out nulls
    eventCount: r._count.id,
  }));
}

  /**
   * Get most common actions
   */
  async getMostCommonActions(limit: number = 10, where?: Prisma.AuditLogWhereInput) {
    const results = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    return results.map(r => ({
      action: r.action,
      count: r._count.id,
    }));
  }

  // ========================================================================
  // SEARCH OPERATIONS
  // ========================================================================

  /**
   * Search logs by payload content
   * Uses Prisma's JSON filtering
   */
  async searchByPayload(
    key: string,
    value: any,
    pagination: PaginationQueryDto,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.findMany({
      payload: {
        path: [key],
        equals: value,
      },
    }, pagination);
  }

  // ========================================================================
  // DELETE OPERATIONS (Data Retention)
  // ========================================================================

  /**
   * Delete logs older than specified date
   * Used for data retention policies
   */
  async deleteOlderThan(date: Date): Promise<{ count: number }> {
    return this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: date,
        },
      },
    });
  }

  /**
   * Delete logs by action type (for cleanup)
   */
  async deleteByAction(action: string): Promise<{ count: number }> {
    return this.prisma.auditLog.deleteMany({
      where: { action },
    });
  }
}