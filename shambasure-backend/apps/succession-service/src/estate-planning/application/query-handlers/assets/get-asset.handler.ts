// query-handlers/assets/get-asset.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAssetQuery } from '../../queries/assets/get-asset.query';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { EstatePlanningRepository } from '../../../infrastructure/repositories/estate-planning.repository';
import { AssetResponseDto } from '../../dto/responses/asset.response.dto';
import { AssetNotFoundException } from '../../../domain/exceptions/asset-not-found.exception';
import { EstatePlanningNotFoundException } from '../../../domain/exceptions/estate-planning-not-found.exception';
import { AssetMapper } from '../../../infrastructure/mappers/asset.mapper';
import { Logger } from '@nestjs/common';

@QueryHandler(GetAssetQuery)
export class GetAssetHandler implements IQueryHandler<GetAssetQuery> {
  private readonly logger = new Logger(GetAssetHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly assetMapper: AssetMapper,
  ) {}

  async execute(query: GetAssetQuery): Promise<AssetResponseDto> {
    const { assetId, estatePlanningId } = query;
    this.logger.debug(`Executing GetAssetQuery for asset: ${assetId}`);

    // If estatePlanningId is provided, validate ownership
    if (estatePlanningId) {
      const estatePlanning = await this.estatePlanningRepository.findById(estatePlanningId);
      if (!estatePlanning) {
        throw new EstatePlanningNotFoundException(estatePlanningId);
      }

      // Check if the asset belongs to the estate planning
      const assetIds = estatePlanning.getAssetIds();
      if (!assetIds.includes(assetId)) {
        throw new AssetNotFoundException(assetId);
      }
    }

    // Load the asset
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new AssetNotFoundException(assetId);
    }

    // Map to response DTO
    return this.assetMapper.toResponseDto(asset);
  }
}