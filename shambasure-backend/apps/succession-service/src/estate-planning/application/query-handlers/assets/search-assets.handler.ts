// query-handlers/assets/search-assets.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { EstatePlanningNotFoundException } from '../../../domain/exceptions/estate-planning-not-found.exception';
import { AssetMapper } from '../../../infrastructure/mappers/asset.mapper';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { EstatePlanningRepository } from '../../../infrastructure/repositories/estate-planning.repository';
import { AssetSummaryResponseDto } from '../../dto/responses/asset-summary.response.dto';
import { SearchAssetsQuery } from '../../queries/assets/search-assets.query';

@QueryHandler(SearchAssetsQuery)
export class SearchAssetsHandler implements IQueryHandler<SearchAssetsQuery> {
  private readonly logger = new Logger(SearchAssetsHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly assetMapper: AssetMapper,
  ) {}

  async execute(query: SearchAssetsQuery): Promise<AssetSummaryResponseDto[]> {
    const { estatePlanningId, searchTerm, filters, limit } = query;
    this.logger.debug(`Executing SearchAssetsQuery for estate planning: ${estatePlanningId}`);

    // Validate estate planning exists
    const estatePlanning = await this.estatePlanningRepository.findById(estatePlanningId);
    if (!estatePlanning) {
      throw new EstatePlanningNotFoundException(estatePlanningId);
    }

    // Get asset IDs from estate planning
    const assetIds = estatePlanning.getAssetIds();

    // If no assets, return empty
    if (assetIds.length === 0) {
      return [];
    }

    // Search assets
    const assets = await this.assetRepository.search({
      assetIds,
      searchTerm,
      filters: filters || {},
      limit: limit || 20,
    });

    // Map to summary DTOs
    return assets.map((asset) => this.assetMapper.toSummaryResponseDto(asset));
  }
}
