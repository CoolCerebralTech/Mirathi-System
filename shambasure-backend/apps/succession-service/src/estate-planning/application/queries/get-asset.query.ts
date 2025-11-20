import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { AssetRepositoryInterface } from '../../domain/interfaces/asset.repository.interface';
import { AssetResponseDto } from '../dto/response/asset.response.dto';

export class GetAssetQuery {
  constructor(
    public readonly assetId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetAssetQuery)
export class GetAssetHandler implements IQueryHandler<GetAssetQuery> {
  constructor(
    @Inject('AssetRepositoryInterface')
    private readonly assetRepository: AssetRepositoryInterface,
  ) {}

  async execute(query: GetAssetQuery): Promise<AssetResponseDto> {
    const { assetId, userId } = query;

    // 1. Fetch Entity
    const asset = await this.assetRepository.findById(assetId);

    // 2. Validate Existence
    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found.`);
    }

    // 3. Validate Ownership
    if (asset.getOwnerId() !== userId) {
      throw new ForbiddenException('You do not have permission to view this asset.');
    }

    // 4. Return DTO
    return plainToInstance(
      AssetResponseDto,
      {
        ...asset,
        currentValue: asset.getCurrentValue(),
        location: asset.getLocation(),
        encumbranceAmount: asset.getEncumbranceAmount(),
      },
      { excludeExtraneousValues: true },
    );
  }
}
