import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService, AuditLog } from '@shamba/database';
import { PaginationQueryDto } from '@shamba/common';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of the Repository
// ============================================================================
// The Repository's ONLY responsibility is to query the database. It is a pure
// data access layer. All complex analytical logic (getSummary, getUserActivity)
// has been REMOVED and now lives in the `AuditingService`.
// ============================================================================

@Injectable()
export class AuditingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new audit log entry.
   */
  async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  /**
   * Finds a single audit log by its unique ID.
   */
  async findOne(where: Prisma.AuditLogWhereUniqueInput): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({ where });
  }

  /**
   * Finds multiple audit logs based on a query, with pagination.
   */
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

  /**
   * A generic method to query logs without pagination, for analytical purposes.
   */
  async query(where: Prisma.AuditLogWhereInput): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({ where });
  }
  
  /**
   * Uses a more efficient database aggregation (groupBy) for stats.
   */
  async getStatsBy(
        by: (keyof Prisma.AuditLogGroupByOutputType)[],
        where: Prisma.AuditLogWhereInput,
    ) {
        // FIX IS HERE: The type for 'by' must be the specific scalar field enum
        const validKeys = by.filter(k => k !== '_count') as Prisma.AuditLogScalarFieldEnum[];
        return this.prisma.auditLog.groupBy({
            by: validKeys, // Use the corrected, filtered keys
            where,
            _count: {
                id: true,
            },
        });
    }

  /**
   * Deletes audit logs older than a specified date.
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
}