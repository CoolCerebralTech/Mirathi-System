import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { AssetRepositoryInterface } from '../../domain/interfaces/asset.repository.interface';
import type { BeneficiaryRepositoryInterface } from '../../domain/interfaces/beneficiary.repository.interface';

export class GetAssetDistributionQuery {
  constructor(
    public readonly assetId: string,
    public readonly userId: string,
  ) {}
}

export class AssetDistributionSummaryResponse {
  totalAllocatedPercent: number;
  beneficiaryCount: number;
  hasResiduary: boolean;
  remainingPercent: number;
}

@QueryHandler(GetAssetDistributionQuery)
export class GetAssetDistributionHandler implements IQueryHandler<GetAssetDistributionQuery> {
  constructor(
    @Inject('AssetRepositoryInterface')
    private readonly assetRepository: AssetRepositoryInterface,
    @Inject('BeneficiaryRepositoryInterface')
    private readonly beneficiaryRepository: BeneficiaryRepositoryInterface,
  ) {}

  async execute(query: GetAssetDistributionQuery): Promise<AssetDistributionSummaryResponse> {
    const { assetId, userId } = query;

    // 1. Check Asset
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) throw new NotFoundException('Asset not found');

    if (asset.getOwnerId() !== userId) throw new ForbiddenException('Access denied');

    // 2. Get Stats from Repo
    const stats = await this.beneficiaryRepository.getAssetDistributionSummary(assetId);

    return {
      totalAllocatedPercent: stats.totalAllocatedPercent,
      beneficiaryCount: stats.beneficiaryCount,
      hasResiduary: stats.hasResiduary,
      remainingPercent: Math.max(0, 100 - stats.totalAllocatedPercent),
    };
  }
}
