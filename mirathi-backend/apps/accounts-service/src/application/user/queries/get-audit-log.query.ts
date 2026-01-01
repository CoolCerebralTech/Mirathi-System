// src/application/user/queries/get-audit-log.query.ts

export interface GetAuditLogQueryPayload {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  limit?: number;
  offset?: number;
}

export class GetAuditLogQuery {
  constructor(public readonly payload: GetAuditLogQueryPayload) {}
}
