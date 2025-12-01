// commands/assets/bulk-update-assets-valuation.command.ts
import { ICommand } from '@nestjs/cqrs';

export interface BulkAssetValuationUpdate {
  assetId: string;
  amount: number;
  valuationDate: Date;
  valuationSource?: string;
}

export class BulkUpdateAssetsValuationCommand implements ICommand {
  constructor(
    public readonly estatePlanningId: string,
    public readonly updates: BulkAssetValuationUpdate[],
    public readonly valuationSource: string,
    public readonly correlationId?: string,
  ) {}
}
