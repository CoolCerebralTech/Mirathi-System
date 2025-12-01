// commands/assets/transfer-asset.command.ts
import { ICommand } from '@nestjs/cqrs';

export class TransferAssetCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly fromEstatePlanningId: string,
    public readonly toEstatePlanningId: string,
    public readonly transferReason: string,
    public readonly correlationId?: string,
  ) {}
}
