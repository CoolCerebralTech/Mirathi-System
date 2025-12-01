// queries/assets/get-asset-summary.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetAssetSummaryQuery implements IQuery {
  constructor(
    public readonly estatePlanningId: string,
    public readonly assetId: string,
  ) {}
}
