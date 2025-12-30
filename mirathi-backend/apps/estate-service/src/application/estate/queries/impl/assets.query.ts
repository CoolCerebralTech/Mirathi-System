import { IQuery } from '@nestjs/cqrs';

import { GetAssetDetailsDto } from '../dtos/assets/get-asset-details.dto';
import { GetEstateAssetsDto } from '../dtos/assets/get-estate-assets.dto';

export class GetEstateAssetsQuery implements IQuery {
  constructor(
    public readonly dto: GetEstateAssetsDto,
    public readonly userId: string,
    public readonly correlationId?: string,
  ) {}
}

export class GetAssetDetailsQuery implements IQuery {
  constructor(
    public readonly dto: GetAssetDetailsDto,
    public readonly userId: string,
    public readonly correlationId?: string,
  ) {}
}
