// commands/assets/remove-asset-matrimonial-status.command.ts
import { ICommand } from '@nestjs/cqrs';

export class RemoveAssetMatrimonialStatusCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly reason: string,
    public readonly correlationId?: string,
  ) {}
}
