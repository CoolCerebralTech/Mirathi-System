// src/presentation/mappers/statistics-presenter.mapper.ts
import { Injectable } from '@nestjs/common';

import { UserStatistics } from '../../application/queries/handlers';
import { RoleCountOutput, StatusCountOutput, UserStatisticsOutput } from '../dtos/outputs';

/**
 * Maps statistics data to GraphQL output
 */
@Injectable()
export class StatisticsPresenterMapper {
  toOutput(stats: UserStatistics): UserStatisticsOutput {
    const byStatus: StatusCountOutput[] = Object.entries(stats.byStatus).map(([status, count]) => ({
      status,
      count,
    }));

    const byRole: RoleCountOutput[] = Object.entries(stats.byRole).map(([role, count]) => ({
      role,
      count,
    }));

    // Calculate total users
    const totalUsers = Object.values(stats.byStatus).reduce((sum, count) => sum + count, 0);

    return {
      byStatus,
      byRole,
      totalUsers,
    };
  }
}
