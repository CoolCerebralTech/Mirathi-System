// ============================================================================
// auditing.entity.ts - Audit Log Entities
// ============================================================================

import { AuditLog as PrismaAuditLog } from '@shamba/database';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * AuditLogEntity - Serializable audit log for API responses
 * Represents an immutable security/compliance event record
 */
@Exclude()
export class AuditLogEntity implements PrismaAuditLog {
  @Expose()
  @ApiProperty({
    example: 'clx123456789',
    description: 'Unique audit log identifier',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    example: '2025-01-15T10:30:45.123Z',
    description: 'Event timestamp',
  })
  timestamp!: Date;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    example: 'clx987654321',
    description: 'User ID who performed the action (null for system events)',
  })
  actorId!: string | null;

  @Expose()
  @ApiProperty({
    example: 'will.created',
    description: 'Action/event type',
  })
  action!: string;

  @Expose()
  @ApiProperty({
    type: Object,
    example: { willId: 'clx123', title: 'My Will', status: 'DRAFT' },
    description: 'Event payload with contextual data',
  })
  payload!: any; // Prisma JSON type

  constructor(partial: Partial<PrismaAuditLog>) {
    Object.assign(this, partial);
  }
}

/**
 * AuditSummaryEntity - Aggregated audit statistics
 * Used for analytics and reporting
 */
@Exclude()
export class AuditSummaryEntity {
  @Expose()
  @ApiProperty({
    example: '2025-01-15',
    description: 'Date or period for this summary',
  })
  date!: string;

  @Expose()
  @ApiProperty({
    example: 1250,
    description: 'Total number of events in period',
  })
  totalEvents!: number;

  @Expose()
  @ApiProperty({
    type: Object,
    example: { 'will.created': 45, 'user.created': 12, 'document.uploaded': 78 },
    description: 'Event count by action type',
  })
  eventsByAction!: Record<string, number>;

  @Expose()
  @ApiProperty({
    example: 234,
    description: 'Number of unique users who performed actions',
  })
  uniqueUsers!: number;

  constructor(partial: Partial<AuditSummaryEntity>) {
    Object.assign(this, partial);
  }
}
