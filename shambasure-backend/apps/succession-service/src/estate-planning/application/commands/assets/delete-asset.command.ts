// commands/assets/delete-asset.command.ts
import { ICommand } from '@nestjs/cqrs';

export class DeleteAssetCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly deletionReason: string,
    public readonly correlationId?: string,
  ) {}
}
