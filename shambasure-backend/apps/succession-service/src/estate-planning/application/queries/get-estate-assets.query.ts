import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { AssetRepositoryInterface } from '../../domain/interfaces/asset.repository.interface';
import { AssetResponseDto } from '../dto/response/asset.response.dto';

export class GetEstateAssetsQuery {
  constructor(
    public readonly userId: string,
    // Optional filters can be added here later (e.g., public readonly type?: AssetType)
  ) {}
}

@QueryHandler(GetEstateAssetsQuery)
export class GetEstateAssetsHandler implements IQueryHandler<GetEstateAssetsQuery> {
  constructor(
    @Inject('AssetRepositoryInterface')
    private readonly assetRepository: AssetRepositoryInterface,
  ) {}

  async execute(query: GetEstateAssetsQuery): Promise<AssetResponseDto[]> {
    const { userId } = query;

    // 1. Fetch Domain Entities
    const assets = await this.assetRepository.findByOwnerId(userId);

    // 2. Map to DTOs
    // We use class-transformer to strip private fields and format Value Objects
    return assets.map((asset) =>
      plainToInstance(
        AssetResponseDto,
        {
          ...asset, // Invokes getters
          currentValue: asset.getCurrentValue(), // Explicit map for VO
          location: asset.getLocation(),
          encumbranceAmount: asset.getEncumbranceAmount(),
          // Note: computed properties like 'transferableValue' can be added to DTO if needed
        },
        { excludeExtraneousValues: true },
      ),
    );
  }
}
