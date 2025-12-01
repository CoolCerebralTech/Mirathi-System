// queries/assets/search-assets.query.ts
import { IQuery } from '@nestjs/cqrs';
import { AssetType } from '@prisma/client';

export class SearchAssetsQuery implements IQuery {
  constructor(
    public readonly estatePlanningId: string,
    public readonly searchTerm: string,
    public readonly filters?: {
      type?: AssetType;
      county?: string;
      minValue?: number;
      maxValue?: number;
    },
    public readonly limit?: number,
  ) {}
}
