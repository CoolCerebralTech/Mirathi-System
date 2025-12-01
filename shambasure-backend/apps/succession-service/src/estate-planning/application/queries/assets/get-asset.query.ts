// queries/assets/get-asset.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetAssetQuery implements IQuery {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId?: string, // Optional: to ensure ownership if needed
  ) {}
}
