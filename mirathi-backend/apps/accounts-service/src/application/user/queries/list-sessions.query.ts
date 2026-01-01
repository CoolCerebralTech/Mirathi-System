// src/application/user/queries/list-sessions.query.ts

export interface ListSessionsQueryPayload {
  userId: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export class ListSessionsQuery {
  constructor(public readonly payload: ListSessionsQueryPayload) {}
}
