// query-handlers/assets/list-assets.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListAssetsQuery } from '../../queries/assets/list-assets.query';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { EstatePlanningRepository } from '../../../infrastructure/repositories/estate-planning.repository';
import { AssetSummaryResponseDto } from '../../../application/dtos/responses/asset-summary.response.dto';
import { EstatePlanningNotFoundException } from '../../../domain/exceptions/estate-planning-not-found.exception';
import { AssetMapper } from '../../../infrastructure/mappers/asset.mapper';
import { Logger } from '@nestjs/common';

@QueryHandler(ListAssetsQuery)
export class ListAssetsHandler implements IQueryHandler<ListAssetsQuery> {
  private readonly logger = new Logger(ListAssetsHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly assetMapper: AssetMapper,
  ) {}

  async execute(query: ListAssetsQuery): Promise<{
    data: AssetSummaryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { estatePlanningId, filters, pagination, sort } = query;
    this.logger.debug(`Executing ListAssetsQuery for estate planning: ${estatePlanningId}`);

    // Validate estate planning exists
    const estatePlanning = await this.estatePlanningRepository.findById(estatePlanningId);
    if (!estatePlanning) {
      throw new EstatePlanningNotFoundException(estatePlanningId);
    }

    // Get asset IDs from estate planning
    const assetIds = estatePlanning.getAssetIds();

    // If no assets, return empty
    if (assetIds.length === 0) {
      return {
        data: [],
        total: 0,
        page: pagination?.page || 1,
        limit: pagination?.limit || 10,
      };
    }

    // Build repository query
    const repositoryQuery = {
      assetIds,
      filters: filters || {},
      pagination: pagination || { page: 1, limit: 10 },
      sort: sort || { field: 'updatedAt', order: 'desc' as const },
    };

    // Fetch assets with pagination and filters
    const { assets, total } = await this.assetRepository.findByQuery(repositoryQuery);

    // Map to summary DTOs
    const data = assets.map(asset => this.assetMapper.toSummaryResponseDto(asset));

    return {
      data,
      total,
      page: repositoryQuery.pagination.page,
      limit: repositoryQuery.pagination.limit,
    };
  }
}
