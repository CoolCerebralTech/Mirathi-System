import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { AuditLogEntity, AuditSummaryEntity, SecurityEventEntity } from '../entities/audit-log.entity';
import { 
  AuditAction, 
  AuditResource, 
  AuditSeverity,
  AuditQueryDto 
} from '@shamba/common';

@Injectable()
export class AuditLogRepository {
  constructor(private prisma: PrismaService) {}

  async create(auditData: {
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
  }): Promise<AuditLogEntity> {
    const auditLog = await this.prisma.auditLog.create({
      data: auditData,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return new AuditLogEntity(auditLog);
  }

  async findById(id: string): Promise<AuditLogEntity> {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return new AuditLogEntity(auditLog);
  }

  async findAll(query: AuditQueryDto): Promise<{
    logs: AuditLogEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, action, resource, userId, severity, status, startDate, endDate, service, correlationId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (userId) {
      where.userId = userId;
    }

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    if (service) {
      where.service = service;
    }

    if (correlationId) {
      where.correlationId = correlationId;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => new AuditLogEntity(log)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSummary(startDate: Date, endDate: Date): Promise<AuditSummaryEntity> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const eventsByAction: Record<string, number> = {};
    const eventsByResource: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const eventsByStatus: Record<string, number> = {};
    
    const uniqueUsers = new Set<string>();
    let totalDuration = 0;
    let durationCount = 0;
    let failureCount = 0;

    logs.forEach(log => {
      // Count by action
      eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;
      
      // Count by resource
      eventsByResource[log.resource] = (eventsByResource[log.resource] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;
      
      // Count by status
      eventsByStatus[log.status] = (eventsByStatus[log.status] || 0) + 1;
      
      // Track unique users
      uniqueUsers.add(log.userId);
      
      // Calculate duration stats
      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }
      
      // Count failures
      if (log.status === 'failure') {
        failureCount++;
      }
    });

    const averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;
    const failureRate = logs.length > 0 ? (failureCount / logs.length) * 100 : 0;

    return new AuditSummaryEntity({
      date: new Date(),
      totalEvents: logs.length,
      eventsByAction,
      eventsByResource,
      eventsBySeverity,
      eventsByStatus,
      uniqueUsers: uniqueUsers.size,
      averageDuration,
      failureRate,
    });
  }

  async getUserActivity(userId: string, days: number = 30): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    lastActivity: Date | null;
    averageDailyActions: number;
    failureRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (logs.length === 0) {
      return {
        totalActions: 0,
        actionsByType: {},
        lastActivity: null,
        averageDailyActions: 0,
        failureRate: 0,
      };
    }

    const actionsByType: Record<string, number> = {};
    let failureCount = 0;

    logs.forEach(log => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      if (log.status === 'failure') {
        failureCount++;
      }
    });

    const totalDays = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const averageDailyActions = logs.length / totalDays;
    const failureRate = (failureCount / logs.length) * 100;

    return {
      totalActions: logs.length,
      actionsByType,
      lastActivity: logs[0].timestamp,
      averageDailyActions,
      failureRate,
    };
  }

  async getServiceStats(service: string, days: number = 7): Promise<{
    service: string;
    totalEvents: number;
    eventsByAction: Record<string, number>;
    averageResponseTime: number;
    errorRate: number;
    mostActiveUsers: Array<{ userId: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        service,
        timestamp: {
          gte: startDate,
        },
      },
    });

    const eventsByAction: Record<string, number> = {};
    const userActivity: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;
    let errorCount = 0;

    logs.forEach(log => {
      eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;
      userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
      
      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }
      
      if (log.status === 'failure') {
        errorCount++;
      }
    });

    const mostActiveUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    return {
      service,
      totalEvents: logs.length,
      eventsByAction,
      averageResponseTime: durationCount > 0 ? totalDuration / durationCount : 0,
      errorRate: logs.length > 0 ? (errorCount / logs.length) * 100 : 0,
      mostActiveUsers,
    };
  }

  async findSuspiciousActivity(days: number = 1): Promise<AuditLogEntity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Look for patterns that might indicate suspicious activity
    const suspiciousLogs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
        OR: [
          { severity: 'HIGH' },
          { status: 'failure' },
          { action: 'USER_LOGIN_FAILED' },
          { action: 'ACCESS_DENIED' },
          { action: 'DATA_EXPORT' },
          { action: 'USER_PERMISSION_CHANGE' },
        ],
      },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return suspiciousLogs.map(log => new AuditLogEntity(log));
  }

  async cleanupOldLogs(retentionDays: number = 365): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return { deletedCount: result.count };
  }

  async exportLogs(startDate: Date, endDate: Date): Promise<AuditLogEntity[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return logs.map(log => new AuditLogEntity(log));
  }
}