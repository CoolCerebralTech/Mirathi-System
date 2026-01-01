// src/application/user/handlers/list-sessions.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ListSessionsQuery } from '../queries/list-sessions.query';

export interface SessionResponse {
  id: string;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isActive: boolean;
}

@QueryHandler(ListSessionsQuery)
export class ListSessionsHandler implements IQueryHandler<ListSessionsQuery> {
  async execute(query: ListSessionsQuery): Promise<SessionResponse[]> {
    const { userId, activeOnly, limit = 50, offset = 0 } = query.payload;

    // This would query a read model (not domain aggregate)
    // For now, return empty array - implementation depends on infrastructure
    return [];
  }
}
