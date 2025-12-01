// commands/assets/remove-asset-encumbrance.command.ts
import { ICommand } from '@nestjs/cqrs';

export class RemoveAssetEncumbranceCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly reason: string,
    public readonly correlationId?: string,
  ) {}
}
