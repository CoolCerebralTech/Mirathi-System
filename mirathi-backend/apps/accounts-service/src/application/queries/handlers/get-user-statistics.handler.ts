// src/application/queries/handlers/get-user-statistics.handler.ts
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../domain/ports/user.repository.port';
import { GetUserStatisticsQuery } from '../impl/get-user-statistics.query';

export interface UserStatistics {
  byStatus: { [status: string]: number };
  byRole: { [role: string]: number };
}

@QueryHandler(GetUserStatisticsQuery)
export class GetUserStatisticsHandler implements IQueryHandler<GetUserStatisticsQuery> {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(_query: GetUserStatisticsQuery): Promise<UserStatistics> {
    const [byStatus, byRole] = await Promise.all([
      this.userRepository.countByStatus(),
      this.userRepository.countByRole(),
    ]);

    return {
      byStatus,
      byRole,
    };
  }
}
