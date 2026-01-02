// src/application/queries/impl/search-users.query.ts
export class SearchUsersQuery {
  constructor(
    public readonly status?: string,
    public readonly role?: string,
    public readonly county?: string,
    public readonly createdAtFrom?: Date,
    public readonly createdAtTo?: Date,
    public readonly limit: number = 50,
    public readonly offset: number = 0,
  ) {}
}
