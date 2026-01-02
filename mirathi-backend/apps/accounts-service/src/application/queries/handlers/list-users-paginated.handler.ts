// src/application/queries/handlers/list-users-paginated.handler.ts
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '../../../domain/aggregates/user.aggregate';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../domain/ports/user.repository.port';
import { ListUsersPaginatedQuery } from '../impl/list-users-paginated.query';

export interface PaginatedUsersResult {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

@QueryHandler(ListUsersPaginatedQuery)
export class ListUsersPaginatedHandler implements IQueryHandler<ListUsersPaginatedQuery> {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(query: ListUsersPaginatedQuery): Promise<PaginatedUsersResult> {
    return await this.userRepository.getPaginatedUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      role: query.role,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}
