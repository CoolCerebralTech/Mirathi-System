import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { GetDistributionReadinessQuery } from '../../impl/reports.query';
import { DistributionPreviewVM } from '../../view-models/distribution-preview.vm';

@QueryHandler(GetDistributionReadinessQuery)
export class GetDistributionReadinessHandler implements IQueryHandler<GetDistributionReadinessQuery> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(query: GetDistributionReadinessQuery): Promise<Result<DistributionPreviewVM>> {
    const { dto } = query;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const readiness = estate.validateDistributionReadiness();
      const netWorth = estate.calculateNetWorth();
      const distributablePool = estate.calculateDistributablePool();

      return Result.ok({
        estateNetValue: {
          amount: netWorth.amount,
          currency: netWorth.currency,
          formatted: netWorth.toString(),
        },
        totalDistributablePool: {
          amount: distributablePool.amount,
          currency: distributablePool.currency,
          formatted: distributablePool.toString(),
        },
        shares: [],
        readinessCheck: {
          isReady: readiness.isValid,
          blockers: readiness.reasons,
        },
      });
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
