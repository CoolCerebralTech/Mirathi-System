// query-handlers/assets/get-asset-encumbrances.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAssetEncumbrancesQuery } from '../../queries/assets/get-asset-encumbrances.query';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { EstatePlanningRepository } from '../../../infrastructure/repositories/estate-planning.repository';
import { AssetNotFoundException } from '../../../domain/exceptions/asset-not-found.exception';
import { EstatePlanningNotFoundException } from '../../../domain/exceptions/estate-planning-not-found.exception';
import { Logger } from '@nestjs/common';

export interface AssetEncumbranceDetails {
  isEncumbered: boolean;
  encumbranceType: string | null;
  encumbranceDetails: string | null;
  encumbranceAmount: number | null;
  hasSignificantEncumbrance: boolean;
}

@QueryHandler(GetAssetEncumbrancesQuery)
export class GetAssetEncumbrancesHandler implements IQueryHandler<GetAssetEncumbrancesQuery> {
  private readonly logger = new Logger(GetAssetEncumbrancesHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
  ) {}

  async execute(query: GetAssetEncumbrancesQuery): Promise<AssetEncumbranceDetails> {
    const { assetId, estatePlanningId } = query;
    this.logger.debug(`Executing GetAssetEncumbrancesQuery for asset: ${assetId}`);

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

    return {
      isEncumbered: asset.isEncumbered,
      encumbranceType: asset.encumbranceType,
      encumbranceDetails: asset.encumbranceDetails,
      encumbranceAmount: asset.encumbranceAmount,
      hasSignificantEncumbrance: asset.isEncumbered && (asset.encumbranceAmount ?? 0) > 0,
    };
  }
}
