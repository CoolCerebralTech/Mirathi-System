// query-handlers/assets/check-asset-transferability.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssetNotFoundException } from '../../../domain/exceptions/asset-not-found.exception';
import { EstatePlanningNotFoundException } from '../../../domain/exceptions/estate-planning-not-found.exception';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { EstatePlanningRepository } from '../../../infrastructure/repositories/estate-planning.repository';
import { CheckAssetTransferabilityQuery } from '../../queries/assets/check-asset-transferability.query';

export interface AssetTransferabilityResult {
  canBeTransferred: boolean;
  reasons: string[];
}

@QueryHandler(CheckAssetTransferabilityQuery)
export class CheckAssetTransferabilityHandler implements IQueryHandler<CheckAssetTransferabilityQuery> {
  private readonly logger = new Logger(CheckAssetTransferabilityHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
  ) {}

  async execute(query: CheckAssetTransferabilityQuery): Promise<AssetTransferabilityResult> {
    const { assetId, estatePlanningId } = query;
    this.logger.debug(`Executing CheckAssetTransferabilityQuery for asset: ${assetId}`);

    // Validate estate planning exists
    const estatePlanning = await this.estatePlanningRepository.findById(estatePlanningId);
    if (!estatePlanning) {
      throw new EstatePlanningNotFoundException(estatePlanningId);
    }

    // Load asset
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new AssetNotFoundException(assetId);
    }

    // Use domain logic to check transferability
    const canBeTransferred = asset.canBeTransferred();
    const reasons: string[] = [];

    if (!asset.isActive) reasons.push('Asset is not active');
    if (asset.verificationStatus !== 'VERIFIED') reasons.push('Asset is not verified');
    if (asset.hasActiveLifeInterest()) reasons.push('Asset has active life interest');
    if (asset.isEncumbered && asset.encumbranceType === 'COURT_ORDER')
      reasons.push('Asset is under court order');

    return {
      canBeTransferred,
      reasons: canBeTransferred ? [] : reasons,
    };
  }
}
