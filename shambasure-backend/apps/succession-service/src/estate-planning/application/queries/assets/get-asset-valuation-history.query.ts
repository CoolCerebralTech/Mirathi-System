// queries/assets/get-asset-valuation-history.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetAssetValuationHistoryQuery implements IQuery {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly limit?: number,
  ) {}
}
