// src/application/queries/impl/list-users-paginated.query.ts
export class ListUsersPaginatedQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly search?: string,
    public readonly status?: string,
    public readonly role?: string,
    public readonly sortBy: string = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
  ) {}
}
