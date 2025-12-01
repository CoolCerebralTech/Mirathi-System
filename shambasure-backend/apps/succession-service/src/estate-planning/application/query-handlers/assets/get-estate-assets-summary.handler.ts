// query-handlers/assets/get-estate-assets-summary.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEstateAssetsSummaryQuery } from '../../queries/assets/get-estate-assets-summary.query';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { EstatePlanningRepository } from '../../../infrastructure/repositories/estate-planning.repository';
import { EstatePlanningNotFoundException } from '../../../domain/exceptions/estate-planning-not-found.exception';
import { Logger } from '@nestjs/common';

export interface EstateAssetsSummary {
  totalAssets: number;
  totalValue: number;
  currency: string;
  byType: Record<string, { count: number; value: number }>;
  byVerificationStatus: Record<string, number>;
  encumberedAssets: number;
  matrimonialAssets: number;
  assetsWithLifeInterest: number;
}

@QueryHandler(GetEstateAssetsSummaryQuery)
export class GetEstateAssetsSummaryHandler implements IQueryHandler<GetEstateAssetsSummaryQuery> {
  private readonly logger = new Logger(GetEstateAssetsSummaryHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
  ) {}

  async execute(query: GetEstateAssetsSummaryQuery): Promise<EstateAssetsSummary> {
    const { estatePlanningId } = query;
    this.logger.debug(`Executing GetEstateAssetsSummaryQuery for estate planning: ${estatePlanningId}`);

    // Validate estate planning exists
    const estatePlanning = await this.estatePlanningRepository.findById(estatePlanningId);
    if (!estatePlanning) {
      throw new EstatePlanningNotFoundException(estatePlanningId);
    }

    // Get asset IDs from estate planning
    const assetIds = estatePlanning.getAssetIds();

    // If no assets, return empty summary
    if (assetIds.length === 0) {
      return {
        totalAssets: 0,
        totalValue: 0,
        currency: 'KES',
        byType: {},
        byVerificationStatus: {},
        encumberedAssets: 0,
        matrimonialAssets: 0,
        assetsWithLifeInterest: 0,
      };
    }

    // Get assets for summary
    const assets = await this.assetRepository.findByIds(assetIds);

    // Calculate summary
    let totalValue = 0;
    const byType: Record<string, { count: number; value: number }> = {};
    const byVerificationStatus: Record<string, number> = {};
    let encumberedAssets = 0;
    let matrimonialAssets = 0;
    let assetsWithLifeInterest = 0;

    assets.forEach(asset => {
      const value = asset.currentValue || 0;
      totalValue += value;

      // By type
      const type = asset.type;
      if (!byType[type]) {
        byType[type] = { count: 0, value: 0 };
      }
      byType[type].count += 1;
      byType[type].value += value;

      // By verification status
      const status = asset.verificationStatus;
      byVerificationStatus[status] = (byVerificationStatus[status] || 0) + 1;

      // Flags
      if (asset.isEncumbered) encumberedAssets += 1;
      if (asset.isMatrimonialProperty) matrimonialAssets += 1;
      if (asset.hasLifeInterest) assetsWithLifeInterest += 1;
    });

    return {
      totalAssets: assets.length,
      totalValue,
      currency: assets[0]?.currency || 'KES',
      byType,
      byVerificationStatus,
      encumberedAssets,
      matrimonialAssets,
      assetsWithLifeInterest,
    };
  }
}
