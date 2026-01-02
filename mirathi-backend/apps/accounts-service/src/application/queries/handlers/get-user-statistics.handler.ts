// src/application/queries/handlers/get-user-statistics.handler.ts
import { Inject, Injectable } from '@nestjs/common';

import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../domain/ports/user.repository.port';
import { GetUserStatisticsQuery } from '../impl/get-user-statistics.query';

export interface UserStatistics {
  byStatus: { [status: string]: number };
  byRole: { [role: string]: number };
}

@Injectable()
export class GetUserStatisticsHandler {
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
