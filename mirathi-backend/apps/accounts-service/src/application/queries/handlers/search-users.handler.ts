// src/application/queries/handlers/search-users.handler.ts
import { Inject, Injectable } from '@nestjs/common';

import { User } from '../../../domain/aggregates/user.aggregate';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../domain/ports/user.repository.port';
import { SearchUsersQuery } from '../impl/search-users.query';

export interface SearchUsersResult {
  users: User[];
  total: number;
}

@Injectable()
export class SearchUsersHandler {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(query: SearchUsersQuery): Promise<SearchUsersResult> {
    return await this.userRepository.findByCriteria({
      status: query.status,
      role: query.role,
      county: query.county,
      createdAtFrom: query.createdAtFrom,
      createdAtTo: query.createdAtTo,
      limit: query.limit,
      offset: query.offset,
    });
  }
}
