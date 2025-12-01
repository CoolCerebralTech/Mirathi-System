// queries/assets/check-asset-transferability.query.ts
import { IQuery } from '@nestjs/cqrs';

export class CheckAssetTransferabilityQuery implements IQuery {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
  ) {}
}
