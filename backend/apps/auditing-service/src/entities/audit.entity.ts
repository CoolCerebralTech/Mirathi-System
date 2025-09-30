import { AuditLog as PrismaAuditLog } from '@shamba/database';

export class AuditLogEntity implements PrismaAuditLog {
  id!: string;
  timestamp!: Date;
  actorId!: string | null;
  action!: string;
  payload!: PrismaAuditLog['payload'];

  constructor(partial: Partial<PrismaAuditLog>) {
    Object.assign(this, partial);
  }
}

export class AuditSummaryEntity {
  date!: Date;
  totalEvents!: number;
  eventsByAction!: Record<string, number>;
  uniqueUsers!: number;

  constructor(partial: Partial<AuditSummaryEntity>) {
    Object.assign(this, partial);
  }
}