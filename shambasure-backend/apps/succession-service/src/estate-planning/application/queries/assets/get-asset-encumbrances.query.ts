// queries/assets/get-asset-encumbrances.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetAssetEncumbrancesQuery implements IQuery {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
  ) {}
}
