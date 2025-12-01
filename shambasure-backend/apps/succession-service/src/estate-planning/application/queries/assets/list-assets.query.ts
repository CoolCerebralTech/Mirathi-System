// queries/assets/list-assets.query.ts
import { IQuery } from '@nestjs/cqrs';
import { AssetType, AssetVerificationStatus, KenyanCounty } from '@prisma/client';

export class ListAssetsQuery implements IQuery {
  constructor(
    public readonly estatePlanningId: string,
    public readonly filters?: {
      type?: AssetType;
      verificationStatus?: AssetVerificationStatus;
      county?: KenyanCounty;
      isEncumbered?: boolean;
      isMatrimonialProperty?: boolean;
      hasLifeInterest?: boolean;
      requiresProbate?: boolean;
      searchTerm?: string;
    },
    public readonly pagination?: {
      page: number;
      limit: number;
    },
    public readonly sort?: {
      field: string;
      order: 'asc' | 'desc';
    },
  ) {}
}
