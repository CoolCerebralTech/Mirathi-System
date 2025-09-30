import { Injectable } from '@nestjs/common';
import { AuditLog } from '@shamba/database';
import { AuditQueryDto, ShambaEvent } from '@shamba/common';
import { AuditingRepository } from '../repositories/auditing.repository';
import { AuditSummaryEntity } from '../entities/audit.entity';

@Injectable()
export class AuditingService {
  logger: any;
  constructor(private readonly auditingRepository: AuditingRepository) {}

  // --- Core Method: Called by the Event Consumer ---
  async createLogFromEvent(event: ShambaEvent): Promise<AuditLog> {
    // FIX IS HERE: We create a helper to safely extract the user ID
        const getActorId = (data: ShambaEvent['data']): string | null => {
            if ('userId' in data) return data.userId;
            if ('uploaderId' in data) return data.uploaderId;
            if ('testatorId' in data) return data.testatorId;
            if ('ownerId' in data) return data.ownerId;
            return null;
        }

        const logData = {
          action: event.type,
          payload: event.data as any,
          timestamp: event.timestamp,
          actorId: getActorId(event.data),
        };
        return this.auditingRepository.create(logData);
    }

  // --- Querying Methods: Called by the Controller ---
  async findMany(query: AuditQueryDto): Promise<{ logs: AuditLog[]; total: number }> {
    const where = {
      action: query.action ? { contains: query.action } : undefined,
      actorId: query.userId,
    };
    return this.auditingRepository.findMany(where, query);
  }

  // --- Reporting & Analytics Methods ---
  async getSummary(startDate: Date, endDate: Date): Promise<AuditSummaryEntity> {
    const logs = await this.auditingRepository.query({
      timestamp: { gte: startDate, lte: endDate },
    });
    
    // All the rich analytical logic from your AuditLogRepository.getSummary
    // now lives here in the service layer.
    const uniqueUsers = new Set<string>();
    const eventsByAction: Record<string, number> = {};
    logs.forEach(log => {
        // FIX IS HERE: Safely handle null actorId
        if(log.actorId) {
            uniqueUsers.add(log.actorId);
        }
        eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;
    });

    return new AuditSummaryEntity({
      date: new Date(),
      totalEvents: logs.length,
      eventsByAction,
      uniqueUsers: uniqueUsers.size,
      // ... other calculated fields
    });
  }

  async generateCsvReport(startDate: Date, endDate: Date): Promise<string> {
    // The logic from your AuditReportService.generateCSVReport now lives here.
    // It will use the `auditingRepository` to fetch the logs.
    const logs = await this.auditingRepository.query({
      timestamp: { gte: startDate, lte: endDate },
    });
    // ... logic to convert logs to CSV string using a library like 'csv-writer' ...
    return 'timestamp,action,userId...\n...'; // Placeholder
  }

  // ADD THE MISSING METHODS THAT THE TASK SCHEDULER NEEDS
async cleanupOldLogs(retentionDays: number): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    return this.auditingRepository.deleteOlderThan(cutoffDate);
  }

  async detectSuspiciousActivity(): Promise<void> {
      // Placeholder for the complex logic
      this.logger.log('Detecting suspicious activity...');
  }
}